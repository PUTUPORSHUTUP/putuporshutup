-- Create fraud detection tables with unique names
create table if not exists public.fraud_match_results (
  id uuid primary key default gen_random_uuid(),
  winner uuid not null,
  loser  uuid not null,
  game text not null,
  mode text not null,
  entry_fee_cents int not null,
  screenshot_hash text,
  created_at timestamptz default now()
);

-- Enable RLS and create policies
alter table public.fraud_match_results enable row level security;

create policy "user can see own fraud match results"
on public.fraud_match_results for select
to authenticated
using (auth.uid() in (winner, loser));

create policy "admins can manage fraud match results"
on public.fraud_match_results for all
to authenticated
using (is_user_admin())
with check (is_user_admin());

create policy "users can insert own fraud match results"
on public.fraud_match_results for insert
to authenticated
with check (auth.uid() in (winner, loser));

-- Update fraud_flags to reference the correct table
drop table if exists public.fraud_flags;
create table public.fraud_flags (
  id uuid primary key default gen_random_uuid(),
  result_id uuid references public.fraud_match_results(id) on delete cascade,
  user_id uuid not null,
  flag fraud_flag_type not null,
  details jsonb,
  created_at timestamptz default now()
);

alter table public.fraud_flags enable row level security;

create policy "user can see own flags"
on public.fraud_flags for select
to authenticated
using (auth.uid() = user_id);

create policy "admins can manage fraud flags"
on public.fraud_flags for all
to authenticated
using (is_user_admin())
with check (is_user_admin());