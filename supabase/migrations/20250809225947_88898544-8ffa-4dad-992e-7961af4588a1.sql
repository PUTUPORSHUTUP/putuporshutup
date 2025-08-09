-- ===== Types & Tables =====
do $$ begin
  create type fraud_flag_type as enum ('WIN_STREAK','RAPID_REMATCH','SCREENSHOT_REUSED','MULTI_ACCOUNT');
exception when duplicate_object then null; end $$;

-- Create tables first
create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  winner uuid not null,
  loser  uuid not null,
  game text not null,
  mode text not null,
  entry_fee_cents int not null,
  screenshot_hash text,
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

-- Add IP column to profiles
alter table public.profiles
  add column if not exists last_ip inet;