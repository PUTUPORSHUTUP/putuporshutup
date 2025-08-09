-- Fix the SQL error in db_market_run function
CREATE OR REPLACE FUNCTION db_market_run(p_auto_seed boolean default true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  v_player_a uuid; v_player_b uuid;
begin
  perform pg_advisory_xact_lock(42);

  -- Count eligible players
  with eligible as (
    select id from market_queue
    where status = 'waiting' and stake_cents > 0
    order by created_at asc
    limit 2
  )
  select count(*) into v_players_paired from eligible;

  -- Auto-seed if needed
  if v_players_paired < 2 and p_auto_seed then
    v_seeded := true;
    v_u1 := gen_random_uuid(); 
    v_u2 := gen_random_uuid();

    insert into market_wallets(user_id, balance_cents)
    values (v_u1, 1000), (v_u2, 1000)
    on conflict (user_id) do update set balance_cents = excluded.balance_cents;

    insert into market_queue (user_id, game_key, stake_cents, status)
    values (v_u1, v_game_key, v_stake_cents, 'waiting'),
           (v_u2, v_game_key, v_stake_cents, 'waiting');

    -- Re-count after seeding
    with eligible as (
      select id from market_queue
      where status = 'waiting'
      order by created_at asc
      limit 2
    )
    select count(*) into v_players_paired from eligible;
  end if;

  -- Check if we have enough players
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

  -- Get the two players (simplified approach)
  select user_id into v_player_a 
  from market_queue 
  where status = 'waiting' 
  order by created_at asc 
  limit 1;

  select user_id into v_player_b 
  from market_queue 
  where status = 'waiting' 
  and user_id != v_player_a
  order by created_at asc 
  limit 1;

  -- Create match
  insert into market_matches (status, game_key, stake_cents, player_a, player_b)
  values ('running', v_game_key, v_stake_cents, v_player_a, v_player_b)
  returning id into v_match_id;

  v_challenge_id := v_match_id;
  v_pot_cents := v_stake_cents * 2;

  -- Remove matched players from queue
  delete from market_queue
  where user_id in (v_player_a, v_player_b) and status = 'waiting';

  -- Demo results: player A wins, B second
  insert into market_match_results (match_id, user_id, placement)
  values (v_match_id, v_player_a, 1), (v_match_id, v_player_b, 2);

  -- Process payouts
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

-- Test the function
SELECT db_market_run(true);