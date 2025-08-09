-- Update the market engine to use game_mode_key system
CREATE OR REPLACE FUNCTION public.db_market_run(p_auto_seed boolean DEFAULT true, p_mode_key text DEFAULT 'COD6:KILL_RACE')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_started_at timestamptz := now();
  v_players_paired int := 0;
  v_seeded boolean := false;

  v_match_id uuid := null;
  v_challenge_id uuid := null;
  v_pot_cents bigint := 0;
  v_paid_rows int := 0;
  v_status text := 'success';

  v_stake_cents bigint := 500;
  v_u1 uuid; v_u2 uuid;
  v_player_a uuid; v_player_b uuid;
  v_game_mode record;
BEGIN
  perform pg_advisory_xact_lock(42);

  -- Validate the game mode exists and is enabled
  SELECT * INTO v_game_mode 
  FROM game_modes gm 
  JOIN game_registry gr ON gm.game_key = gr.game_key
  WHERE gm.mode_key = p_mode_key AND gm.enabled = true AND gr.enabled = true;
  
  IF v_game_mode IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'invalid_mode',
      'message', 'Game mode not found or disabled: ' || p_mode_key,
      'seeded', false,
      'challenge_id', '',
      'players_paired', 0,
      'pot_cents', 0,
      'paid_rows', 0,
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
  END IF;

  -- Count eligible players for this specific mode
  WITH eligible AS (
    SELECT id FROM market_queue
    WHERE status = 'waiting' 
      AND game_mode_key = p_mode_key
      AND stake_cents > 0
    ORDER BY created_at ASC
    LIMIT v_game_mode.max_players
  )
  SELECT count(*) INTO v_players_paired FROM eligible;

  -- Auto-seed if needed and enabled
  IF v_players_paired < v_game_mode.min_players AND p_auto_seed THEN
    v_seeded := true;
    v_u1 := gen_random_uuid(); 
    v_u2 := gen_random_uuid();

    INSERT INTO market_wallets(user_id, balance_cents)
    VALUES (v_u1, 1000), (v_u2, 1000)
    ON CONFLICT (user_id) DO UPDATE SET balance_cents = excluded.balance_cents;

    INSERT INTO market_queue (user_id, game_mode_key, stake_cents, status)
    VALUES (v_u1, p_mode_key, v_stake_cents, 'waiting'),
           (v_u2, p_mode_key, v_stake_cents, 'waiting');

    -- Re-count after seeding
    WITH eligible AS (
      SELECT id FROM market_queue
      WHERE status = 'waiting' AND game_mode_key = p_mode_key
      ORDER BY created_at ASC
      LIMIT v_game_mode.max_players
    )
    SELECT count(*) INTO v_players_paired FROM eligible;
  END IF;

  -- Check if we have enough players
  IF v_players_paired < v_game_mode.min_players THEN
    v_status := 'no_players';
    RETURN jsonb_build_object(
      'status', v_status,
      'seeded', v_seeded,
      'challenge_id', '',
      'players_paired', v_players_paired,
      'pot_cents', 0,
      'paid_rows', 0,
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
  END IF;

  -- Get the players (simplified 1v1 for now)
  SELECT user_id INTO v_player_a 
  FROM market_queue 
  WHERE status = 'waiting' AND game_mode_key = p_mode_key
  ORDER BY created_at ASC 
  LIMIT 1;

  SELECT user_id INTO v_player_b 
  FROM market_queue 
  WHERE status = 'waiting' AND game_mode_key = p_mode_key
    AND user_id != v_player_a
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Create match with game_mode_key
  INSERT INTO market_matches (status, game_mode_key, stake_cents, player_a, player_b)
  VALUES ('running', p_mode_key, v_stake_cents, v_player_a, v_player_b)
  RETURNING id INTO v_match_id;

  v_challenge_id := v_match_id;
  v_pot_cents := v_stake_cents * 2;

  -- Remove matched players from queue
  DELETE FROM market_queue
  WHERE user_id IN (v_player_a, v_player_b) AND status = 'waiting';

  -- Use the adapter pattern to generate results
  PERFORM ingest_results(v_match_id, p_mode_key);

  -- Process payouts
  v_paid_rows := market_payout_safe(v_match_id, v_pot_cents);

  RETURN jsonb_build_object(
    'status', v_status,
    'seeded', v_seeded,
    'mode_key', p_mode_key,
    'challenge_id', coalesce(v_challenge_id::text, ''),
    'players_paired', coalesce(v_players_paired, 0),
    'pot_cents', coalesce(v_pot_cents, 0),
    'paid_rows', coalesce(v_paid_rows, 0),
    'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
  );

EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'seeded', v_seeded,
      'reason', sqlstate || ':' || replace(coalesce(sqlerrm,'(no message)'), chr(10), ' '),
      'challenge_id', '',
      'players_paired', coalesce(v_players_paired, 0),
      'pot_cents', coalesce(v_pot_cents, 0),
      'paid_rows', coalesce(v_paid_rows, 0),
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
END;
$function$;