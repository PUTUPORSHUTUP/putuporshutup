CREATE OR REPLACE FUNCTION public.atomic_market_cycle_v2()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  challenge_id UUID;
  player_ids UUID[];
  start_time TIMESTAMPTZ := clock_timestamp();
  duration_ms INTEGER := 0;
  players_count INTEGER := 0;
  total_pot_amount NUMERIC := 0;
  paid_rows_count INTEGER := 0;
  error_message TEXT;
  error_detail TEXT;
BEGIN
  -- PHASE 1: PLAYER SELECTION - Get test users with sufficient balance
  WITH available_players AS (
    SELECT user_id as id 
    FROM profiles 
    WHERE is_test_user = TRUE
    AND wallet_balance >= 100
    ORDER BY last_used ASC NULLS FIRST
    LIMIT 8
    FOR UPDATE SKIP LOCKED
  )
  SELECT array_agg(id) INTO player_ids
  FROM available_players;
  
  -- Check if we have enough players, if not use any available users
  IF array_length(player_ids, 1) < 8 THEN
    WITH fallback_players AS (
      SELECT user_id as id 
      FROM profiles 
      WHERE wallet_balance >= 100
      ORDER BY last_used ASC NULLS FIRST
      LIMIT 8
      FOR UPDATE SKIP LOCKED
    )
    SELECT array_agg(id) INTO player_ids
    FROM fallback_players;
  END IF;

  -- Still not enough players? Return safe error response
  IF array_length(player_ids, 1) < 2 THEN
    PERFORM log_event('player_shortage', 
      json_build_object('available', COALESCE(array_length(player_ids, 1), 0))::text);
    RETURN json_build_object(
      'ok', false,
      'error', 'Insufficient players',
      'challenge_id', '',
      'players', 0,
      'duration_ms', 0,
      'pot_cents', 0,
      'paid_rows', 0
    );
  END IF;

  players_count := array_length(player_ids, 1);
  total_pot_amount := players_count * 100 * 0.9;

  -- PHASE 2: CHALLENGE CREATION - Use existing challenges table with correct status
  INSERT INTO challenges (
    title, 
    stake_amount, 
    total_pot, 
    max_participants, 
    status,
    creator_id,
    challenge_type,
    game_id,
    platform
  ) VALUES (
    'Market Challenge ' || to_char(now(), 'YYYYMMDD-HH24MISS'),
    100,
    total_pot_amount,
    players_count,
    'open', -- Changed from 'active' to 'open'
    player_ids[1], -- Use first player as creator
    'market_simulation',
    (SELECT id FROM games LIMIT 1), -- Use any available game
    'Xbox'
  ) RETURNING id INTO challenge_id;

  -- PHASE 3: PLAYER REGISTRATION - Use existing challenge_participants table
  WITH registration AS (
    INSERT INTO challenge_participants (challenge_id, user_id, stake_paid, status)
    SELECT 
      challenge_id, 
      id, 
      100, 
      'joined'
    FROM unnest(player_ids) AS id
    RETURNING user_id
  )
  UPDATE profiles p
  SET wallet_balance = wallet_balance - 100,
      last_used = NOW()
  FROM registration r
  WHERE p.user_id = r.user_id;

  -- PHASE 4: GENERATE RESULTS - Create random match results
  WITH placements AS (
    SELECT 
      player_id,
      ROW_NUMBER() OVER (ORDER BY RANDOM()) as placement,
      floor(random() * 5000 + 1000)::integer as score,
      floor(random() * 30 + 5)::integer as kills,
      floor(random() * 20 + 5)::integer as deaths,
      floor(random() * 15)::integer as assists,
      floor(random() * 10000 + 2000)::numeric as damage_dealt
    FROM unnest(player_ids) as player_id
  )
  INSERT INTO match_results (match_id, player_id, placement, score, kills, deaths, assists, damage_dealt)
  SELECT challenge_id, player_id, placement, score, kills, deaths, assists, damage_dealt
  FROM placements;

  -- PHASE 5: PROCESS PAYOUTS - Dynamic payout based on player count
  WITH total_pot AS (
    SELECT total_pot_amount as pot
  ),
  prizes AS (
    SELECT 
      mr.player_id,
      CASE 
        WHEN mr.placement = 1 THEN (tp.pot * 0.6)::NUMERIC
        WHEN mr.placement = 2 AND players_count >= 4 THEN (tp.pot * 0.3)::NUMERIC
        WHEN mr.placement = 3 AND players_count >= 6 THEN (tp.pot * 0.1)::NUMERIC
        ELSE 0::NUMERIC
      END AS amount
    FROM match_results mr
    CROSS JOIN total_pot tp
    WHERE mr.match_id = challenge_id
    AND (
      mr.placement = 1 OR 
      (mr.placement = 2 AND players_count >= 4) OR
      (mr.placement = 3 AND players_count >= 6)
    )
  )
  UPDATE profiles p
  SET wallet_balance = wallet_balance + pr.amount
  FROM prizes pr
  WHERE p.user_id = pr.player_id AND pr.amount > 0;

  -- Record payout transactions and count them
  WITH payout_inserts AS (
    INSERT INTO wallet_transactions (profile_id, match_id, amount, type)
    SELECT 
      mr.player_id, 
      challenge_id, 
      CASE 
        WHEN mr.placement = 1 THEN (total_pot_amount * 0.6)::NUMERIC
        WHEN mr.placement = 2 AND players_count >= 4 THEN (total_pot_amount * 0.3)::NUMERIC
        WHEN mr.placement = 3 AND players_count >= 6 THEN (total_pot_amount * 0.1)::NUMERIC
        ELSE 0
      END, 
      'prize'
    FROM match_results mr
    WHERE mr.match_id = challenge_id
    AND (
      mr.placement = 1 OR 
      (mr.placement = 2 AND players_count >= 4) OR
      (mr.placement = 3 AND players_count >= 6)
    )
    AND CASE 
      WHEN mr.placement = 1 THEN (total_pot_amount * 0.6)::NUMERIC
      WHEN mr.placement = 2 AND players_count >= 4 THEN (total_pot_amount * 0.3)::NUMERIC
      WHEN mr.placement = 3 AND players_count >= 6 THEN (total_pot_amount * 0.1)::NUMERIC
      ELSE 0
    END > 0
    RETURNING *
  )
  SELECT COUNT(*) INTO paid_rows_count FROM payout_inserts;

  -- PHASE 6: FINALIZE - Update challenge status to completed
  UPDATE challenges 
  SET status = 'completed',
      winner_id = (SELECT player_id FROM match_results WHERE match_id = challenge_id AND placement = 1),
      updated_at = NOW()
  WHERE id = challenge_id;

  -- Calculate final duration
  duration_ms := EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000;

  -- Log success
  PERFORM log_event('market_completed', json_build_object(
    'challenge_id', challenge_id,
    'players', players_count,
    'duration_ms', duration_ms
  )::text);

  -- SUCCESS RESPONSE with safe values (using COALESCE)
  RETURN json_build_object(
    'ok', true,
    'success', true,
    'challenge_id', COALESCE(challenge_id::text, ''),
    'players', COALESCE(players_count, 0),
    'duration_ms', COALESCE(duration_ms, 0),
    'pot_cents', COALESCE((total_pot_amount * 100)::integer, 0),
    'paid_rows', COALESCE(paid_rows_count, 0)
  );
  
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS 
    error_message = MESSAGE_TEXT,
    error_detail = PG_EXCEPTION_DETAIL;
    
  PERFORM log_event('engine_failure', 
    json_build_object(
      'challenge_id', COALESCE(challenge_id::text, ''),
      'error', error_message,
      'detail', error_detail
    )::text);
           
  RETURN json_build_object(
    'ok', false,
    'error', COALESCE(error_message, 'Unknown error'),
    'detail', COALESCE(error_detail, ''),
    'challenge_id', COALESCE(challenge_id::text, ''),
    'players', 0,
    'duration_ms', 0,
    'pot_cents', 0,
    'paid_rows', 0
  );
END;
$function$;