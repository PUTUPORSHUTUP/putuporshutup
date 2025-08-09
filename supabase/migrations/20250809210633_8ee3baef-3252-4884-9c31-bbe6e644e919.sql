-- ============================================
-- PUOSU Security Settings (table + RLS + RPCs) - FIXED
-- ============================================

create extension if not exists pgcrypto;

-- ---- Admin helper (if you don't already have it)
create table if not exists app_admins (
  user_id uuid primary key,
  added_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql stable
as $$ select exists (select 1 from app_admins where user_id = auth.uid()); $$;

-- ---- Single-row settings table
create table if not exists security_settings (
  id int primary key default 1,
  otp_expiry_minutes int not null default 3 check (otp_expiry_minutes between 1 and 15),
  max_login_attempts int not null default 3 check (max_login_attempts between 1 and 10),
  lockout_duration_minutes int not null default 5 check (lockout_duration_minutes between 1 and 60),
  breach_check boolean not null default true,
  fraud_detection boolean not null default true,
  updated_at timestamptz not null default now()
);

-- seed one row
insert into security_settings (id) values (1)
on conflict (id) do nothing;

-- ---- Audit log (optional but useful)
create table if not exists security_settings_audit (
  id bigserial primary key,
  changed_by uuid,
  before_json jsonb,
  after_json  jsonb,
  changed_at  timestamptz not null default now()
);

-- ---- RLS
alter table security_settings enable row level security;

-- Users can read (needed for UI), admins can write
drop policy if exists ss_read_all on security_settings;
create policy ss_read_all on security_settings
for select to authenticated
using (true);

drop policy if exists ss_admin_insert on security_settings;
create policy ss_admin_insert on security_settings
for insert to authenticated
with check (is_admin());

drop policy if exists ss_admin_update on security_settings;
create policy ss_admin_update on security_settings
for update to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists ss_admin_delete on security_settings;
create policy ss_admin_delete on security_settings
for delete to authenticated
using (is_admin());

-- Ensure no FORCE RLS (definer RPCs still okay, but keep simple)
alter table security_settings no force row level security;

-- ---- RPC: get settings
create or replace function security_settings_get()
returns security_settings
language sql
security definer
set search_path = public
as $$
  select * from security_settings where id = 1;
$$;

-- ---- RPC: save settings (admin only)
create or replace function security_settings_save(
  p_otp int,
  p_max_attempts int,
  p_lockout int,
  p_breach boolean,
  p_fraud boolean
) returns security_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before jsonb;
  v_after  jsonb;
  v_row    security_settings;
begin
  if not is_admin() then
    raise exception 'admin_only';
  end if;

  -- sanity (mirrors CHECKs; gives cleaner error messages)
  if p_otp    is null or p_otp    < 1 or p_otp    > 15 then raise exception 'otp_expiry_minutes_out_of_range'; end if;
  if p_max_attempts is null or p_max_attempts < 1 or p_max_attempts > 10 then raise exception 'max_login_attempts_out_of_range'; end if;
  if p_lockout is null or p_lockout < 1 or p_lockout > 60 then raise exception 'lockout_duration_minutes_out_of_range'; end if;

  select to_jsonb(s.*) into v_before from security_settings s where id=1;

  insert into security_settings as s (id, otp_expiry_minutes, max_login_attempts, lockout_duration_minutes, breach_check, fraud_detection, updated_at)
  values (1, p_otp, p_max_attempts, p_lockout, coalesce(p_breach,true), coalesce(p_fraud,true), now())
  on conflict (id) do update set
    otp_expiry_minutes = excluded.otp_expiry_minutes,
    max_login_attempts = excluded.max_login_attempts,
    lockout_duration_minutes = excluded.lockout_duration_minutes,
    breach_check = excluded.breach_check,
    fraud_detection = excluded.fraud_detection,
    updated_at = now()
  returning * into v_row;

  select to_jsonb(v_row) into v_after;

  insert into security_settings_audit(changed_by, before_json, after_json)
  values (auth.uid(), v_before, v_after);

  return v_row;
end;
$$;

-- ---- Permissions
revoke all on function security_settings_get()  from public;
revoke all on function security_settings_save(int,int,int,boolean,boolean) from public;
grant execute on function security_settings_get()  to authenticated, service_role;
grant execute on function security_settings_save(int,int,int,boolean,boolean) to authenticated, service_role;