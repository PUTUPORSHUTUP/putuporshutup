-- Fix db_market_run function with simpler SQL syntax
CREATE OR REPLACE FUNCTION public.db_market_run(p_auto_seed boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_game_id uuid;
  v_stake_amount numeric := 5.00; -- $5 in dollars
  v_u1 uuid; v_u2 uuid;
  v_player1 uuid; v_player2 uuid;
  v_game_name text;
begin
  perform pg_advisory_xact_lock(42);  -- prevent overlap runs

  -- Get a game ID
  SELECT id, display_name INTO v_game_id, v_game_name FROM games LIMIT 1;

  -- -------- 1) Try to find two eligible waiting players
  with eligible as (
    select id, user_id, game_id, stake_amount
    from match_queue
    where queue_status = 'searching'
      and stake_amount > 0
    order by queued_at asc
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
    insert into match_queue (user_id, game_id, platform, stake_amount, queue_status, queued_at, expires_at)
    values (v_u1, v_game_id, 'Xbox', v_stake_amount, 'searching', now(), now() + interval '10 minutes'),
           (v_u2, v_game_id, 'Xbox', v_stake_amount, 'searching', now(), now() + interval '10 minutes');

    -- re-count after seeding
    with eligible as (
      select id from match_queue
      where queue_status = 'searching'
      order by queued_at asc
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

  -- -------- 4) Get the two players from queue
  with queue_players as (
    select user_id, stake_amount, row_number() over (order by queued_at asc) as rn
    from match_queue
    where queue_status = 'searching'
    limit 2
  )
  select 
    max(case when rn = 1 then user_id end),
    max(case when rn = 2 then user_id end),
    max(stake_amount) * 100  -- convert to cents
  into v_player1, v_player2, v_pot_cents
  from queue_players;

  -- Create match
  insert into matches (status, game_key, stake_cents, player_a, player_b)
  values ('running', v_game_name || ':MATCH', v_pot_cents, v_player1, v_player2)
  returning id into v_match_id;

  v_challenge_id := v_match_id;  -- reuse as challenge id
  v_pot_cents := v_pot_cents * 2; -- total pot for both players

  -- remove those queue rows
  delete from match_queue
  where user_id in (v_player1, v_player2) and queue_status = 'searching';

  -- -------- 5) Generate simple results (A wins, B second) for test/demo
  insert into match_results (match_id, user_id, placement)
  values (v_match_id, v_player1, 1), (v_match_id, v_player2, 2);

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
$function$;