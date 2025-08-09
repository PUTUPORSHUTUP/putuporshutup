-- Clean up duplicate db_market_run functions and fix the market engine
-- First, drop all existing versions to eliminate ambiguity
DROP FUNCTION IF EXISTS db_market_run() CASCADE;
DROP FUNCTION IF EXISTS db_market_run(boolean) CASCADE;
DROP FUNCTION IF EXISTS db_market_run(boolean, text) CASCADE;

-- Create a single, clean version that works with our current tables
CREATE OR REPLACE FUNCTION db_market_run(p_auto_seed boolean DEFAULT true, p_mode_key text DEFAULT 'COD6:KILL_RACE')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
BEGIN
  perform pg_advisory_xact_lock(42);

  -- Count eligible players
  WITH eligible AS (
    SELECT id FROM market_queue
    WHERE status = 'waiting' AND stake_cents > 0
    ORDER BY created_at ASC
    LIMIT 2
  )
  SELECT count(*) INTO v_players_paired FROM eligible;

  -- Auto-seed if needed
  IF v_players_paired < 2 AND p_auto_seed THEN
    v_seeded := true;
    v_u1 := gen_random_uuid(); 
    v_u2 := gen_random_uuid();

    INSERT INTO market_wallets(user_id, balance_cents)
    VALUES (v_u1, 1000), (v_u2, 1000)
    ON CONFLICT (user_id) DO UPDATE SET balance_cents = EXCLUDED.balance_cents;

    INSERT INTO market_queue (user_id, game_key, stake_cents, status)
    VALUES (v_u1, p_mode_key, v_stake_cents, 'waiting'),
           (v_u2, p_mode_key, v_stake_cents, 'waiting');

    -- Re-count after seeding
    WITH eligible AS (
      SELECT id FROM market_queue
      WHERE status = 'waiting'
      ORDER BY created_at ASC
      LIMIT 2
    )
    SELECT count(*) INTO v_players_paired FROM eligible;
  END IF;

  -- Check if we have enough players
  IF v_players_paired < 2 THEN
    v_status := 'no_players';
    RETURN jsonb_build_object(
      'status', v_status,
      'seeded', v_seeded,
      'challenge_id', '',
      'players_paired', 0,
      'pot_cents', 0,
      'paid_rows', 0,
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
  END IF;

  -- Get the two players
  SELECT user_id INTO v_player_a 
  FROM market_queue 
  WHERE status = 'waiting' 
  ORDER BY created_at ASC 
  LIMIT 1;

  SELECT user_id INTO v_player_b 
  FROM market_queue 
  WHERE status = 'waiting' 
  AND user_id != v_player_a
  ORDER BY created_at ASC 
  LIMIT 1;

  -- Create match
  INSERT INTO market_matches (status, game_key, stake_cents, player_a, player_b)
  VALUES ('running', p_mode_key, v_stake_cents, v_player_a, v_player_b)
  RETURNING id INTO v_match_id;

  v_challenge_id := v_match_id;
  v_pot_cents := v_stake_cents * 2;

  -- Remove matched players from queue
  DELETE FROM market_queue
  WHERE user_id IN (v_player_a, v_player_b) AND status = 'waiting';

  -- Demo results: player A wins, B second
  INSERT INTO market_match_results (match_id, user_id, placement)
  VALUES (v_match_id, v_player_a, 1), (v_match_id, v_player_b, 2);

  -- Process payouts
  v_paid_rows := market_payout_safe(v_match_id, v_pot_cents);

  RETURN jsonb_build_object(
    'status', v_status,
    'seeded', v_seeded,
    'challenge_id', COALESCE(v_challenge_id::text, ''),
    'players_paired', COALESCE(v_players_paired, 0),
    'pot_cents', COALESCE(v_pot_cents, 0),
    'paid_rows', COALESCE(v_paid_rows, 0),
    'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'seeded', v_seeded,
      'reason', SQLSTATE || ':' || replace(COALESCE(SQLERRM,'(no message)'), chr(10), ' '),
      'challenge_id', '',
      'players_paired', COALESCE(v_players_paired, 0),
      'pot_cents', COALESCE(v_pot_cents, 0),
      'paid_rows', COALESCE(v_paid_rows, 0),
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
END;
$$;

-- Recreate the production wrapper
CREATE OR REPLACE FUNCTION db_market_run_prod()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN db_market_run(false);
END;
$$;