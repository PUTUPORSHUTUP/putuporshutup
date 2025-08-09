-- AUTO-SEEDING DATABASE MARKET ENGINE (SAFE)
-- Pairs players, creates a match, generates dummy results, pays out 50/30/20 (10% fee),
-- and returns clean JSON. If no eligible players, it auto-seeds two test users.

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

  -- config for test seeding
  v_game_key text := 'COD6:KILL_RACE';
  v_stake_cents bigint := 500; -- $5
  v_u1 uuid; v_u2 uuid;
begin
  perform pg_advisory_xact_lock(42);  -- prevent overlap runs

  -- -------- 1) Try to find two eligible waiting players
  with eligible as (
    select id, user_id, game_key, stake_cents
    from match_queue
    where status = 'waiting'
      and stake_cents > 0
    order by created_at asc
    limit 2
  )
  select count(*) into v_players_paired from eligible;

  -- -------- 2) Auto-seed if none and allowed
  if v_players_paired < 2 and p_auto_seed then
    v_seeded := true;
    v_u1 := gen_random_uuid();
    v_u2 := gen_random_uuid();

    -- ensure wallets with balance
    insert into wallets(user_id, balance_cents)
    values (v_u1, 1000), (v_u2, 1000)
    on conflict (user_id) do update set balance_cents = excluded.balance_cents;

    -- add test queue entries
    insert into match_queue (user_id, game_key, stake_cents, status)
    values (v_u1, v_game_key, v_stake_cents, 'waiting'),
           (v_u2, v_game_key, v_stake_cents, 'waiting');

    -- re-count after seeding
    with eligible as (
      select id from match_queue
      where status = 'waiting'
      order by created_at asc
      limit 2
    )
    select count(*) into v_players_paired from eligible;
  end if;

  -- -------- 3) If still not enough, exit gracefully
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

  -- -------- 4) Create match from the two oldest waiting entries
  insert into matches (status, game_key, stake_cents, player_a, player_b)
  select 'running', q1.game_key, q1.stake_cents, q1.user_id, q2.user_id
  from (
    select * from match_queue where status='waiting' order by created_at asc limit 2
  ) q
  cross join lateral (select q.* order by created_at asc limit 1) q1
  cross join lateral (select q.* order by created_at desc limit 1) q2
  returning id, stake_cents into v_match_id, v_stake_cents;

  v_challenge_id := v_match_id;  -- reuse as challenge id
  v_pot_cents := v_stake_cents * 2;

  -- remove those queue rows
  delete from match_queue
  where id in (
    select id from match_queue order by created_at asc limit 2
  );

  -- -------- 5) Generate simple results (A wins, B second) for test/demo
  insert into match_results (match_id, user_id, placement)
  select v_match_id, player_a, 1 from matches where id = v_match_id;
  insert into match_results (match_id, user_id, placement)
  select v_match_id, player_b, 2 from matches where id = v_match_id;

  -- -------- 6) Payout using safe function (50/30/20, 10% fee)
  v_paid_rows := db_market_payout_safe(v_match_id, v_pot_cents);

  -- -------- 7) Return success JSON (never nulls)
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

-- Minimal perms so the client can call it
revoke all on function db_market_run(boolean) from public;
grant execute on function db_market_run(boolean) to anon, authenticated, service_role;