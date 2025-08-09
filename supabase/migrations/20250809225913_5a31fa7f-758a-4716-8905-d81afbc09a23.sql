-- ===== Types & Tables =====
do $$ begin
  create type fraud_flag_type as enum ('WIN_STREAK','RAPID_REMATCH','SCREENSHOT_REUSED','MULTI_ACCOUNT');
exception when duplicate_object then null; end $$;

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  winner uuid not null,
  loser  uuid not null,
  game text not null,
  mode text not null,
  entry_fee_cents int not null,
  screenshot_hash text,             -- sha256 of the uploaded proof image
  created_at timestamptz default now()
);

create table if not exists public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  result_id uuid references public.match_results(id) on delete cascade,
  user_id uuid not null,
  flag fraud_flag_type not null,
  details jsonb,
  created_at timestamptz default now()
);

-- Optional: keep last IP on profiles (if not already there)
alter table public.profiles
  add column if not exists last_ip inet;

-- RLS (readable by mods/admin via service key; users can see their own flags)
alter table public.match_results enable row level security;
alter table public.fraud_flags enable row level security;

create policy "user can see own results"
on public.match_results for select
to authenticated
using (auth.uid() in (winner, loser));

create policy "user can see own flags"
on public.fraud_flags for select
to authenticated
using (auth.uid() = user_id);

-- ===== Helper Functions =====
-- Rapid rematch: same two players >3 times in 24h
create or replace function public.flag_rapid_rematch(p_res uuid) returns void
language plpgsql as $$
declare r record; c int;
begin
  select winner, loser into r from public.match_results where id = p_res;
  select count(*) into c
  from public.match_results
  where ((winner=r.winner and loser=r.loser) or (winner=r.loser and loser=r.winner))
    and created_at >= now() - interval '24 hours';
  if c > 3 then
    insert into public.fraud_flags(result_id,user_id,flag,details)
    values (p_res, r.winner, 'RAPID_REMATCH', jsonb_build_object('count_24h', c)),
           (p_res, r.loser,  'RAPID_REMATCH', jsonb_build_object('count_24h', c));
  end if;
end $$;

-- Win streak: >8 wins in last 24h on same mode at same stake
create or replace function public.flag_win_streak(p_res uuid) returns void
language plpgsql as $$
declare r record; c int;
begin
  select winner, game, mode, entry_fee_cents into r
  from public.match_results where id = p_res;

  select count(*) into c
  from public.match_results
  where winner = r.winner
    and game = r.game and mode = r.mode
    and entry_fee_cents = r.entry_fee_cents
    and created_at >= now() - interval '24 hours';

  if c > 8 then
    insert into public.fraud_flags(result_id,user_id,flag,details)
    values (p_res, r.winner, 'WIN_STREAK',
            jsonb_build_object('wins_24h', c, 'game', r.game, 'mode', r.mode, 'entry', r.entry_fee_cents));
  end if;
end $$;

-- Screenshot reused: same hash used >1 time in 7 days
create or replace function public.flag_screenshot_reused(p_res uuid) returns void
language plpgsql as $$
declare h text; c int; uid uuid;
begin
  select screenshot_hash, winner into h, uid from public.match_results where id = p_res;
  if h is null then return; end if;

  select count(*) into c
  from public.match_results
  where screenshot_hash = h
    and created_at >= now() - interval '7 days';

  if c > 1 then
    insert into public.fraud_flags(result_id,user_id,flag,details)
    values (p_res, uid, 'SCREENSHOT_REUSED', jsonb_build_object('uses_7d', c));
  end if;
end $$;

-- Multi-account: if two users who share an IP have played each other in last 7 days
create or replace function public.flag_multi_account(p_res uuid) returns void
language plpgsql as $$
declare a uuid; b uuid; ip inet; shared int;
begin
  select winner, loser into a, b from public.match_results where id = p_res;

  -- NOTE: populate profiles.last_ip on login in your app
  with ips as (
    select p.user_id, p.last_ip from public.profiles p where p.user_id in (a,b)
  )
  select count(*) into shared
  from ips i1 join ips i2 on i1.last_ip = i2.last_ip and i1.user_id <> i2.user_id;

  if coalesce(shared,0) > 0 then
    insert into public.fraud_flags(result_id,user_id,flag,details)
    values (p_res, a, 'MULTI_ACCOUNT', jsonb_build_object('shared_ip', true)),
           (p_res, b, 'MULTI_ACCOUNT', jsonb_build_object('shared_ip', true));
  end if;
end $$;

-- ===== Trigger: run all checks after a result is recorded =====
create or replace function public.after_match_result_fraud_checks()
returns trigger language plpgsql as $$
begin
  perform public.flag_rapid_rematch(new.id);
  perform public.flag_win_streak(new.id);
  perform public.flag_screenshot_reused(new.id);
  perform public.flag_multi_account(new.id);
  return new;
end $$;

drop trigger if exists trg_after_match_result_fraud on public.match_results;
create trigger trg_after_match_result_fraud
after insert on public.match_results
for each row execute function public.after_match_result_fraud_checks();