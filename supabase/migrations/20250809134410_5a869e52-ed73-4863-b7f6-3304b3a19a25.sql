-- ============================================
-- PUOSU MARKET ENGINE: FULL INSTALL (SCHEMA COMPATIBLE)
-- ============================================

-- ---------- SCHEMA SAFETY ----------
create extension if not exists pgcrypto;

-- wallets (separate from existing profiles.wallet_balance)
create table if not exists market_wallets (
  user_id uuid primary key,
  balance_cents bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table market_wallets disable row level security;

-- market transactions
create table if not exists market_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount_cents bigint not null,
  reason text not null,
  ref_match uuid,
  created_at timestamptz not null default now(),
  constraint market_wallet_tx_nonzero check (amount_cents <> 0)
);
alter table market_wallet_transactions disable row level security;

-- market queue (separate from existing match_queue)
create table if not exists market_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stake_cents bigint not null,
  game_key text,
  status text not null default 'waiting',
  created_at timestamptz not null default now()
);
alter table market_queue disable row level security;

-- market matches (separate from existing matches if any conflicts)
create table if not exists market_matches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running',
  game_key text,
  stake_cents bigint not null default 0,
  player_a uuid,
  player_b uuid,
  created_at timestamptz not null default now()
);
alter table market_matches disable row level security;

-- market results
create table if not exists market_match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  user_id uuid not null,
  placement int not null,
  created_at timestamptz not null default now()
);
alter table market_match_results disable row level security;

-- market payouts
create table if not exists market_payouts (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  winner_id uuid not null,
  amount_cents bigint not null,
  status text not null default 'paid',
  error text,
  created_at timestamptz not null default now()
);
alter table market_payouts disable row level security;

-- Helpful indexes
create index if not exists idx_market_queue_status_game_stake_created
  on market_queue (status, game_key, stake_cents, created_at);
create index if not exists idx_market_matches_game_key on market_matches (game_key);

-- ---------- WALLET CREDIT RPC ----------
create or replace function market_wallet_credit(
  p_user_id uuid,
  p_amount_cents bigint,
  p_reason text,
  p_ref_match uuid
) returns void
language plpgsql
as $$
begin
  if p_amount_cents <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  insert into market_wallet_transactions(user_id, amount_cents, reason, ref_match)
  values (p_user_id, p_amount_cents, p_reason, p_ref_match);

  update market_wallets
     set balance_cents = balance_cents + p_amount_cents,
         updated_at = now()
   where user_id = p_user_id;

  if not found then
    -- create wallet then credit
    insert into market_wallets(user_id, balance_cents) values (p_user_id, 0)
    on conflict (user_id) do update set balance_cents = excluded.balance_cents;

    update market_wallets
       set balance_cents = balance_cents + p_amount_cents,
           updated_at = now()
     where user_id = p_user_id;
  end if;
end;
$$;

-- ---------- SAFE 50/30/20 PAYOUT (10% fee) ----------
create or replace function market_payout_safe(
  p_match_id uuid,
  p_total_pot_cents bigint
) returns integer
language plpgsql
as $$
declare
  v_fee_bp int := 1000; -- 10%
  v_pot_cents bigint := coalesce(p_total_pot_cents, 0);
  v_fee_cents bigint := (v_pot_cents * v_fee_bp) / 10000;
  v_net_pot bigint := greatest(v_pot_cents - v_fee_cents, 0);

  v_paid_count int := 0;
  u1 uuid; u2 uuid; u3 uuid;
  a1 bigint := 0; a2 bigint := 0; a3 bigint := 0;
  v_sum bigint := 0; v_remainder bigint := 0;
begin
  if v_net_pot <= 0 then
    return 0;
  end if;

  -- pull placements 1..3
  select user_id into u1 from market_match_results where match_id = p_match_id and placement = 1 limit 1;
  select user_id into u2 from market_match_results where match_id = p_match_id and placement = 2 limit 1;
  select user_id into u3 from market_match_results where match_id = p_match_id and placement = 3 limit 1;

  if u1 is not null then a1 := (v_net_pot * 50) / 100; end if;
  if u2 is not null then a2 := (v_net_pot * 30) / 100; end if;
  if u3 is not null then a3 := (v_net_pot * 20) / 100; end if;

  v_sum := coalesce(a1,0) + coalesce(a2,0) + coalesce(a3,0);
  v_remainder := greatest(v_net_pot - v_sum, 0);

  -- give leftover pennies fairly
  while v_remainder > 0 loop
    if u1 is not null and v_remainder > 0 then a1 := a1 + 1; v_remainder := v_remainder - 1; end if;
    if u2 is not null and v_remainder > 0 then a2 := a2 + 1; v_remainder := v_remainder - 1; end if;
    if u3 is not null and v_remainder > 0 then a3 := a3 + 1; v_remainder := v_remainder - 1; end if;
    exit when v_remainder = 0;
  end loop;

  -- insert payouts + credit wallets
  if u1 is not null and a1 > 0 then
    insert into market_payouts(match_id, winner_id, amount_cents, status)
    values (p_match_id, u1, a1, 'paid');
    perform market_wallet_credit(u1, a1, 'match_win', p_match_id);
    v_paid_count := v_paid_count + 1;
  end if;
  if u2 is not null and a2 > 0 then
    insert into market_payouts(match_id, winner_id, amount_cents, status)
    values (p_match_id, u2, a2, 'paid');
    perform market_wallet_credit(u2, a2, 'match_win', p_match_id);
    v_paid_count := v_paid_count + 1;
  end if;
  if u3 is not null and a3 > 0 then
    insert into market_payouts(match_id, winner_id, amount_cents, status)
    values (p_match_id, u3, a3, 'paid');
    perform market_wallet_credit(u3, a3, 'match_win', p_match_id);
    v_paid_count := v_paid_count + 1;
  end if;

  return v_paid_count;
end;
$$;

-- ---------- MARKET ENGINE FUNCTION ----------
create or replace function db_market_run(p_auto_seed boolean default true)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started_at timestamptz := now();
  v_players_paired int := 0;
  v_seeded boolean := false;

  v_match_id uuid := null;
  v_challenge_id uuid := null;
  v_pot_cents bigint := 0;
  v_paid_rows int := 0;
  v_status text := 'success';

  v_game_key text := 'COD6:KILL_RACE';
  v_stake_cents bigint := 500;
  v_u1 uuid; v_u2 uuid;
begin
  perform pg_advisory_xact_lock(42);

  with eligible as (
    select id from market_queue
    where status = 'waiting' and stake_cents > 0
    order by created_at asc
    limit 2
  )
  select count(*) into v_players_paired from eligible;

  if v_players_paired < 2 and p_auto_seed then
    v_seeded := true;
    v_u1 := gen_random_uuid(); v_u2 := gen_random_uuid();

    insert into market_wallets(user_id, balance_cents)
    values (v_u1, 1000), (v_u2, 1000)
    on conflict (user_id) do update set balance_cents = excluded.balance_cents;

    insert into market_queue (user_id, game_key, stake_cents, status)
    values (v_u1, v_game_key, v_stake_cents, 'waiting'),
           (v_u2, v_game_key, v_stake_cents, 'waiting');

    with eligible as (
      select id from market_queue
      where status = 'waiting'
      order by created_at asc
      limit 2
    )
    select count(*) into v_players_paired from eligible;
  end if;

  if v_players_paired < 2 then
    v_status := 'no_players';
    return jsonb_build_object(
      'status', v_status,
      'seeded', v_seeded,
      'challenge_id', '',
      'players_paired', 0,
      'pot_cents', 0,
      'paid_rows', 0,
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
  end if;

  -- Create match from queue entries
  insert into market_matches (status, game_key, stake_cents, player_a, player_b)
  select 'running', v_game_key, v_stake_cents, q1.user_id, q2.user_id
  from (
    select user_id, row_number() over (order by created_at) as rn
    from market_queue 
    where status = 'waiting' 
    order by created_at asc 
    limit 2
  ) ranked
  cross join lateral (
    select user_id from ranked where rn = 1
  ) q1
  cross join lateral (
    select user_id from ranked where rn = 2
  ) q2
  limit 1
  returning id, stake_cents, game_key into v_match_id, v_stake_cents, v_game_key;

  v_challenge_id := v_match_id;
  v_pot_cents := v_stake_cents * 2;

  -- Remove matched players from queue
  delete from market_queue
  where user_id in (
    select user_id from market_queue 
    where status = 'waiting' 
    order by created_at asc 
    limit 2
  );

  -- Demo results: player A wins, B second
  insert into market_match_results (match_id, user_id, placement)
  select v_match_id, player_a, 1 from market_matches where id = v_match_id;
  insert into market_match_results (match_id, user_id, placement)
  select v_match_id, player_b, 2 from market_matches where id = v_match_id;

  v_paid_rows := market_payout_safe(v_match_id, v_pot_cents);

  return jsonb_build_object(
    'status', v_status,
    'seeded', v_seeded,
    'challenge_id', coalesce(v_challenge_id::text, ''),
    'players_paired', coalesce(v_players_paired, 0),
    'pot_cents', coalesce(v_pot_cents, 0),
    'paid_rows', coalesce(v_paid_rows, 0),
    'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
  );

exception
  when others then
    return jsonb_build_object(
      'status', 'error',
      'seeded', v_seeded,
      'reason', sqlstate || ':' || replace(coalesce(sqlerrm,'(no message)'), chr(10), ' '),
      'challenge_id', '',
      'players_paired', coalesce(v_players_paired, 0),
      'pot_cents', coalesce(v_pot_cents, 0),
      'paid_rows', coalesce(v_paid_rows, 0),
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
end;
$$;

-- ---------- PROD WRAPPER ----------
create or replace function db_market_run_prod()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return db_market_run(false);
end;
$$;

-- ---------- PERMISSIONS ----------
revoke all on function db_market_run(boolean) from public;
revoke all on function db_market_run_prod() from public;
grant execute on function db_market_run(boolean) to anon, authenticated, service_role;
grant execute on function db_market_run_prod() to anon, authenticated, service_role;