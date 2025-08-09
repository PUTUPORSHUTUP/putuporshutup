-- Migrate existing data to use the new game_mode_key system
UPDATE match_queue 
SET game_mode_key = 'COD6:KILL_RACE' 
WHERE game_mode_key IS NULL;

UPDATE market_matches 
SET game_mode_key = 'COD6:KILL_RACE' 
WHERE game_mode_key IS NULL;

-- Create a dev convenience function to quickly test any game mode
CREATE OR REPLACE FUNCTION queue_test_players(p_mode_key text DEFAULT 'COD6:KILL_RACE', p_count int DEFAULT 2)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mode_exists boolean;
  v_queued_count int := 0;
  i int;
  v_user_id uuid;
BEGIN
  -- Check if mode exists and is enabled
  SELECT EXISTS(
    SELECT 1 FROM game_modes gm 
    JOIN game_registry gr ON gm.game_key = gr.game_key
    WHERE gm.mode_key = p_mode_key AND gm.enabled = true AND gr.enabled = true
  ) INTO v_mode_exists;
  
  IF NOT v_mode_exists THEN
    RETURN jsonb_build_object(
      'status', 'error', 
      'message', 'Game mode not found or disabled: ' || p_mode_key
    );
  END IF;
  
  -- Add test players to queue
  FOR i IN 1..p_count LOOP
    v_user_id := gen_random_uuid();
    
    -- Ensure user has wallet
    INSERT INTO market_wallets (user_id, balance_cents)
    VALUES (v_user_id, 1000)
    ON CONFLICT (user_id) DO UPDATE SET balance_cents = 1000;
    
    -- Add to queue
    INSERT INTO market_queue (user_id, game_mode_key, stake_cents, status)
    VALUES (v_user_id, p_mode_key, 500, 'waiting');
    
    v_queued_count := v_queued_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Added ' || v_queued_count || ' players to ' || p_mode_key || ' queue',
    'mode_key', p_mode_key,
    'players_queued', v_queued_count
  );
END$$;