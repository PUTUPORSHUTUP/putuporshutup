-- Requires: extension pgcrypto; helper is_admin()

create extension if not exists pgcrypto;

-- Where we store the console IP and the ENCRYPTED API key
create table if not exists xbox_integration (
  id          int primary key default 1,
  console_ip  inet not null,
  enc_api_key bytea not null,
  status      text not null default 'configured',
  updated_at  timestamptz not null default now()
);
alter table xbox_integration enable row level security;
-- Only admins may read/update
drop policy if exists xi_admin_rw on xbox_integration;
create policy xi_admin_rw on xbox_integration
for all to authenticated
using (is_admin()) with check (is_admin());

-- RPC: save settings (validates format, encrypts key). Returns a checklist for the UI.
create or replace function xbox_configure(p_console_ip text, p_api_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip inet;
  v_steps jsonb := '[]'::jsonb;
begin
  if not is_admin() then
    raise exception 'admin_only';
  end if;

  -- Step 1: IP format
  begin
    v_ip := p_console_ip::inet;
    v_steps := v_steps || jsonb_build_object('step','ip_format','ok',true,'detail',v_ip::text);
  exception when others then
    return jsonb_build_object('ok',false,'steps', v_steps || jsonb_build_object('step','ip_format','ok',false,'detail','invalid_ip'));
  end;

  -- Step 2: API key presence/length
  if p_api_key is null or length(trim(p_api_key)) < 20 then
    return jsonb_build_object('ok',false,'steps', v_steps || jsonb_build_object('step','api_key','ok',false,'detail','too_short_or_empty'));
  end if;
  v_steps := v_steps || jsonb_build_object('step','api_key','ok',true);

  -- Step 3: Encrypt & store (uses env setting app.kms_key; set this in Edge function before calling if you want)
  perform set_config('app.kms_key', current_setting('app.kms_key', true), true);
  if coalesce(current_setting('app.kms_key', true),'') = '' then
    -- still store, but mark that runtime key isn't set; Edge validator will check real validity
    v_steps := v_steps || jsonb_build_object('step','kms_key','ok',false,'detail','app.kms_key not set (Edge will validate)');
    insert into xbox_integration(id, console_ip, enc_api_key, status)
    values (1, v_ip, pgp_sym_encrypt(p_api_key, 'TEMP_FALLBACK_DO_NOT_USE'), 'configured')
    on conflict (id) do update
      set console_ip=excluded.console_ip, enc_api_key=excluded.enc_api_key, status='configured', updated_at=now();
  else
    insert into xbox_integration(id, console_ip, enc_api_key, status)
    values (1, v_ip, pgp_sym_encrypt(p_api_key, current_setting('app.kms_key')), 'configured')
    on conflict (id) do update
      set console_ip=excluded.console_ip, enc_api_key=excluded.enc_api_key, status='configured', updated_at=now();
    v_steps := v_steps || jsonb_build_object('step','kms_key','ok',true);
  end if;

  return jsonb_build_object('ok', true, 'steps', v_steps);
end;
$$;

revoke all on function xbox_configure(text, text) from public;
grant execute on function xbox_configure(text, text) to authenticated, service_role;