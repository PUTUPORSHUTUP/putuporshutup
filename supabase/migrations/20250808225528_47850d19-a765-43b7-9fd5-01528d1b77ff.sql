-- DROP PREVIOUS VERSIONS
DROP FUNCTION IF EXISTS atomic_market_cycle CASCADE;

-- Create market events table for logging
CREATE TABLE IF NOT EXISTS market_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create match_results table if not exists
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    player_id UUID NOT NULL,
    placement INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    damage_dealt NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create wallet_transactions table if not exists
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL,
    match_id UUID,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to profiles if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_test_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ;

-- Add columns to matches if they don't exist  
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS crash_reason TEXT,
ADD COLUMN IF NOT EXISTS crashed BOOLEAN DEFAULT FALSE;

-- EVENT LOGGING
CREATE OR REPLACE FUNCTION log_event(event_type TEXT, details TEXT) 
RETURNS VOID AS $$
BEGIN
  INSERT INTO market_events (event_type, details)
  VALUES (event_type, details);
END;
$$ LANGUAGE plpgsql;

-- CRASH HANDLER
CREATE OR REPLACE FUNCTION handle_crash(match_id UUID, reason TEXT) 
RETURNS VOID AS $$
BEGIN
  -- Update match status
  UPDATE matches 
  SET 
    status = 'crashed',
    crash_reason = reason,
    crashed = TRUE
  WHERE id = match_id;
  
  -- Refund players
  WITH refunds AS (
    UPDATE profiles p
    SET wallet_balance = wallet_balance + mq.entry_fee
    FROM match_queue mq
    WHERE mq.match_id = handle_crash.match_id
    AND p.id = mq.player_id
    RETURNING p.id
  )
  INSERT INTO wallet_transactions (profile_id, match_id, amount, type)
  SELECT id, match_id, 100, 'refund' FROM refunds;
  
  PERFORM log_event('crash_handled', format('%s: %s', match_id, reason));
END;
$$ LANGUAGE plpgsql;

-- GENERATE RESULTS
CREATE OR REPLACE FUNCTION generate_results(match_id UUID, player_ids UUID[]) 
RETURNS VOID AS $$
DECLARE
  player_id UUID;
  placement_counter INTEGER := 1;
BEGIN
  -- Generate random stats for each player and assign placements
  FOR player_id IN 
    SELECT unnest(player_ids) 
    ORDER BY random() -- Randomize winner
  LOOP
    INSERT INTO match_results (
      match_id,
      player_id,
      score,
      kills,
      deaths,
      assists,
      damage_dealt,
      placement
    ) VALUES (
      match_id,
      player_id,
      floor(random() * 5000 + 1000)::integer, -- Score 1000-6000
      floor(random() * 30 + 5)::integer,      -- Kills 5-35
      floor(random() * 20 + 5)::integer,      -- Deaths 5-25
      floor(random() * 15)::integer,          -- Assists 0-15
      floor(random() * 10000 + 2000)::numeric, -- Damage 2000-12000
      placement_counter
    );
    
    placement_counter := placement_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- PAYOUT PROCESSING
CREATE OR REPLACE FUNCTION process_payouts(match_id UUID) 
RETURNS VOID AS $$
BEGIN
  -- Top 3 prizes
  WITH prizes AS (
    SELECT 
      player_id,
      CASE placement
        WHEN 1 THEN 400
        WHEN 2 THEN 240
        WHEN 3 THEN 160
        ELSE 0
      END AS amount
    FROM match_results
    WHERE match_id = process_payouts.match_id
    AND placement <= 3
  )
  UPDATE profiles p
  SET wallet_balance = wallet_balance + pr.amount
  FROM prizes pr
  WHERE p.id = pr.player_id AND pr.amount > 0;

  -- Record transactions
  INSERT INTO wallet_transactions (profile_id, match_id, amount, type)
  SELECT 
    player_id, 
    match_id, 
    amount, 
    'prize' 
  FROM (
    SELECT 
      player_id,
      match_id,
      CASE placement
        WHEN 1 THEN 400
        WHEN 2 THEN 240
        WHEN 3 THEN 160
        ELSE 0
      END AS amount
    FROM match_results
    WHERE match_id = process_payouts.match_id
    AND placement <= 3
  ) prizes
  WHERE amount > 0;
END;
$$ LANGUAGE plpgsql;

-- PLAYER REGISTRATION
CREATE OR REPLACE FUNCTION register_players(
  match_id UUID, 
  player_ids UUID[]
) RETURNS VOID AS $$
BEGIN
  -- Atomic registration with balance check
  WITH registration AS (
    INSERT INTO match_queue (match_id, player_id, entry_fee, status)
    SELECT 
      match_id, 
      id, 
      100, 
      'joined'
    FROM unnest(player_ids) AS id
    RETURNING player_id
  )
  UPDATE profiles p
  SET wallet_balance = wallet_balance - 100,
      last_used = NOW()
  FROM registration r
  WHERE p.id = r.player_id;
END;
$$ LANGUAGE plpgsql;

-- MARKET EXECUTION
CREATE OR REPLACE FUNCTION execute_market(
  match_id UUID, 
  player_ids UUID[]
) RETURNS VOID AS $$
DECLARE
  crash_probability NUMERIC := 0.05;
  should_crash BOOLEAN;
BEGIN
  -- Update match status
  UPDATE matches SET status = 'active' WHERE id = match_id;
  PERFORM log_event('market_active', match_id::text);

  -- Crash simulation (5% probability)
  should_crash := (random() < crash_probability);
  IF should_crash THEN
    PERFORM handle_crash(match_id, 'simulated_crash');
    RETURN;
  END IF;

  -- Generate results
  PERFORM generate_results(match_id, player_ids);
  
  -- Process payouts
  PERFORM process_payouts(match_id);
  
  -- Finalize
  UPDATE matches SET status = 'completed' WHERE id = match_id;
  PERFORM log_event('market_completed', match_id::text);
END;
$$ LANGUAGE plpgsql;

-- CORE ENGINE
CREATE OR REPLACE FUNCTION atomic_market_cycle_v2() 
RETURNS JSON AS $$
DECLARE
  match_id UUID;
  player_ids UUID[];
  start_time TIMESTAMPTZ := clock_timestamp();
  error_message TEXT;
  error_detail TEXT;
BEGIN
  -- PHASE 1: PLAYER SELECTION
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
  
  IF array_length(player_ids, 1) < 8 THEN
    PERFORM log_event('player_shortage', 
      format('Available: %s', COALESCE(array_length(player_ids, 1), 0)));
    RETURN json_build_object('error', 'Insufficient players');
  END IF;

  -- PHASE 2: MATCH CREATION
  INSERT INTO matches (
    title, 
    entry_fee, 
    total_pot, 
    max_participants, 
    status,
    created_by,
    match_type
  ) VALUES (
    'Market Match ' || to_char(now(), 'YYYYMMDD-HH24MISS'),
    100,
    800,
    8,
    'initializing',
    player_ids[1], -- Use first player as creator
    'standard'
  ) RETURNING id INTO match_id;

  -- PHASE 3: PLAYER REGISTRATION
  PERFORM register_players(match_id, player_ids);

  -- PHASE 4: MARKET EXECUTION
  PERFORM execute_market(match_id, player_ids);

  -- SUCCESS METRICS
  RETURN json_build_object(
    'match_id', match_id,
    'duration_ms', (EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000)::int,
    'players', array_length(player_ids, 1)
  );
  
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS 
    error_message = MESSAGE_TEXT,
    error_detail = PG_EXCEPTION_DETAIL;
    
  PERFORM log_event('engine_failure', 
    format('Match: %s | Error: %s | Detail: %s', 
           match_id, error_message, error_detail));
           
  RETURN json_build_object(
    'error', error_message,
    'detail', error_detail,
    'match_id', match_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DIAGNOSTICS VIEW
CREATE OR REPLACE VIEW market_dashboard AS
SELECT 
  event_type,
  COUNT(*) AS event_count,
  MIN(created_at) AS first_occurrence,
  MAX(created_at) AS last_occurrence
FROM market_events
GROUP BY event_type;

-- HEALTH CHECK VIEW
CREATE OR REPLACE VIEW market_health AS
SELECT
  (SELECT COUNT(*) FROM matches) AS total_matches,
  (SELECT COUNT(*) FROM matches WHERE crashed) AS crashed_matches,
  (SELECT COUNT(*) FROM market_events) AS total_events,
  (SELECT COUNT(DISTINCT match_id) FROM wallet_transactions) AS settled_matches,
  (SELECT AVG(wallet_balance) FROM profiles WHERE is_test_user) AS avg_balance;