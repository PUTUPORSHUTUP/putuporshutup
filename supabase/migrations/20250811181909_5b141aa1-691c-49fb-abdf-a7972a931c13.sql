-- 1) Free demo matches (system-created, no money)
create table if not exists public.demo_matches (
  id uuid primary key default gen_random_uuid(),
  game text not null default 'Call of Duty',
  mode text not null default 'Multiplayer',
  platform text not null default 'Xbox Series X',
  starts_at timestamptz not null,
  ends_at timestamptz,
  state text not null default 'active', -- active | closed | canceled
  created_at timestamptz not null default now()
);

-- 2) Participants in each free demo match
create table if not exists public.demo_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.demo_matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (match_id, user_id)
);

-- Helpful indexes
create index if not exists idx_demo_matches_starts_at on public.demo_matches(starts_at);
create index if not exists idx_demo_matches_state on public.demo_matches(state);
create index if not exists idx_demo_participants_match on public.demo_participants(match_id);

-- Row Level Security
alter table public.demo_matches enable row level security;
alter table public.demo_participants enable row level security;

-- Policies: anyone can read, only authed can join
do $$ begin
  create policy "Anyone can select demo matches"
    on public.demo_matches for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can select demo participants"
    on public.demo_participants for select
    using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authed users can join demo matches"
    on public.demo_participants for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- Optional: only admins can insert/update demo_matches directly
-- (Edge function will run as service role)
do $$ begin
  create policy "No direct insert/update by clients"
    on public.demo_matches for all
    to authenticated
    using (false)
    with check (false);
exception when duplicate_object then null; end $$;