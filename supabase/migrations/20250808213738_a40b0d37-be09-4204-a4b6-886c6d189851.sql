-- Create monitoring tables for the atomic market engine
CREATE TABLE IF NOT EXISTS market_events (
  id BIGSERIAL PRIMARY KEY,
  match_id UUID,
  event_type TEXT NOT NULL,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_engine_errors (
  id BIGSERIAL PRIMARY KEY,
  error TEXT NOT NULL,
  stack TEXT,
  environment JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add last_used column to profiles for test user rotation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_used TIMESTAMPTZ;

-- Create atomic market cycle function
CREATE OR REPLACE FUNCTION atomic_market_cycle(
  min_players INTEGER DEFAULT 6,
  crash_rate NUMERIC DEFAULT 0.05,
  force_no_crash BOOLEAN DEFAULT TRUE
) RETURNS JSONB AS $$
DECLARE
  challenge_id UUID;
  user_ids UUID[];
  should_crash BOOLEAN;
  crash_reason TEXT;
  refund_count INTEGER := 0;
  selected_game RECORD;
  total_pot NUMERIC := 0;
  winner_record RECORD;
  participants_count INTEGER;
BEGIN
  -- Start atomic transaction
  BEGIN
    -- 1. Get random active game
    SELECT id, title, description INTO selected_game
    FROM games 
    WHERE is_active = true 
    ORDER BY random() 
    LIMIT 1;
    
    IF selected_game.id IS NULL THEN
      RAISE EXCEPTION 'No active games found';
    END IF;
    
    -- 2. Create challenge
    INSERT INTO challenges (
      title,
      description,
      game_id,
      game_title,
      challenge_type,
      stake_amount,
      max_participants,
      status,
      creator_id,
      is_public,
      platform
    ) VALUES (
      'Atomic Market ' || selected_game.title || ' - ' || NOW()::TEXT,
      'Automated atomic market cycle challenge',
      selected_game.id,
      selected_game.title,
      CASE WHEN min_players = 2 THEN '1v1' ELSE 'multiplayer' END,
      5.00,
      min_players,
      'open',
      '00000000-0000-0000-0000-000000000001', -- Default system user
      false,
      'multi'
    ) RETURNING id INTO challenge_id;
    
    -- Log creation
    PERFORM log_market_event(challenge_id, 'challenge_created', jsonb_build_object('game', selected_game.title));
    
    -- 3. Get available test users (with lock to prevent race conditions)
    SELECT array_agg(user_id) INTO user_ids
    FROM (
      SELECT user_id 
      FROM profiles
      WHERE is_test_account = true
      AND wallet_balance >= 5.00
      ORDER BY COALESCE(last_used, '1970-01-01'::timestamptz), created_at
      LIMIT min_players
      FOR UPDATE SKIP LOCKED
    ) t;
    
    participants_count := array_length(user_ids, 1);
    
    IF participants_count < min_players THEN
      RAISE EXCEPTION 'Insufficient test users: % available, % needed', 
        participants_count, min_players;
    END IF;
    
    -- 4. Join players atomically
    FOR i IN 1..participants_count LOOP
      PERFORM secure_join_challenge_atomic(
        challenge_id,
        user_ids[i],
        5.00
      );
      total_pot := total_pot + 5.00;
    END LOOP;
    
    -- Update challenge with total pot and activate
    UPDATE challenges 
    SET total_pot = total_pot,
        status = 'active', 
        start_time = NOW()
    WHERE id = challenge_id;
    
    PERFORM log_market_event(challenge_id, 'players_joined', jsonb_build_object('count', participants_count, 'total_pot', total_pot));
    
    -- 5. Determine if we should crash (for testing)
    should_crash := NOT force_no_crash AND random() < crash_rate;
    
    IF should_crash THEN
      -- Simulate crash scenario
      crash_reason := 'simulated_network_timeout';
      
      SELECT COUNT(*) INTO refund_count
      FROM refund_all_challenge_players(challenge_id, crash_reason);
      
      PERFORM log_market_event(challenge_id, 'simulated_crash', jsonb_build_object('reason', crash_reason, 'refunds', refund_count));
      
      RETURN jsonb_build_object(
        'success', true,
        'challenge_id', challenge_id,
        'crashed', true,
        'refund_count', refund_count,
        'participants', participants_count,
        'message', 'Challenge crashed - all players refunded'
      );
    END IF;
    
    -- 6. Generate results
    PERFORM generate_challenge_results(challenge_id, user_ids);
    PERFORM log_market_event(challenge_id, 'results_generated');
    
    -- 7. Process payouts using secure settlement
    PERFORM secure_settle_challenge(challenge_id);
    PERFORM settle_challenge_payouts(challenge_id);
    
    -- Get winner information
    SELECT cs.user_id, cs.score INTO winner_record
    FROM challenge_stats cs
    WHERE cs.challenge_id = challenge_id
    ORDER BY cs.placement ASC
    LIMIT 1;
    
    -- Mark challenge as completed
    UPDATE challenges
    SET status = 'completed',
        end_time = NOW(),
        winner_id = winner_record.user_id
    WHERE id = challenge_id;
    
    PERFORM log_market_event(challenge_id, 'payouts_completed', jsonb_build_object('winner', winner_record.user_id));
    
    -- Success!
    RETURN jsonb_build_object(
      'success', true,
      'challenge_id', challenge_id,
      'crashed', false,
      'participants', participants_count,
      'total_pot', total_pot,
      'winner', jsonb_build_object('user_id', winner_record.user_id, 'score', winner_record.score),
      'message', 'Atomic market cycle completed successfully'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Automatic rollback happens here
    PERFORM log_market_event(challenge_id, 'cycle_failed', jsonb_build_object('error', SQLERRM));
    RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supporting function: Generate challenge results
CREATE OR REPLACE FUNCTION generate_challenge_results(
  challenge_id UUID,
  user_ids UUID[]
) RETURNS VOID AS $$
DECLARE
  user_id UUID;
  placement_counter INTEGER := 1;
BEGIN
  -- Generate random stats for each user and assign placements
  FOR user_id IN 
    SELECT unnest(user_ids) 
    ORDER BY random() -- Randomize winner
  LOOP
    INSERT INTO challenge_stats (
      challenge_id,
      user_id,
      score,
      kills,
      deaths,
      assists,
      damage,
      placement
    ) VALUES (
      challenge_id,
      user_id,
      floor(random() * 5000 + 1000)::integer, -- Score 1000-6000
      floor(random() * 30 + 5)::integer,      -- Kills 5-35
      floor(random() * 20 + 5)::integer,      -- Deaths 5-25
      floor(random() * 15)::integer,          -- Assists 0-15
      floor(random() * 10000 + 2000)::integer, -- Damage 2000-12000
      placement_counter
    );
    
    placement_counter := placement_counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supporting function: Settle challenge payouts
CREATE OR REPLACE FUNCTION settle_challenge_payouts(challenge_id UUID) RETURNS VOID AS $$
DECLARE
  challenge_record RECORD;
  total_pot NUMERIC;
  fee_rate NUMERIC := 0.10; -- 10% platform fee
  net_pot NUMERIC;
  payout_amounts NUMERIC[];
BEGIN
  -- Get challenge details
  SELECT challenge_type, total_pot INTO challenge_record
  FROM challenges 
  WHERE id = challenge_id;
  
  total_pot := challenge_record.total_pot;
  net_pot := total_pot * (1 - fee_rate);
  
  IF challenge_record.challenge_type = '1v1' THEN
    -- Winner takes all for 1v1
    PERFORM secure_increment_wallet_balance(
      cs.user_id,
      net_pot,
      'challenge_payout',
      challenge_id,
      false
    )
    FROM challenge_stats cs
    WHERE cs.challenge_id = challenge_id 
    AND cs.placement = 1;
  ELSE
    -- Top 3 split for multiplayer (60/30/10)
    payout_amounts := ARRAY[
      (net_pot * 0.6)::NUMERIC,
      (net_pot * 0.3)::NUMERIC, 
      (net_pot * 0.1)::NUMERIC
    ];
    
    FOR i IN 1..LEAST(3, (SELECT COUNT(*) FROM challenge_stats WHERE challenge_id = challenge_id)) LOOP
      PERFORM secure_increment_wallet_balance(
        cs.user_id,
        payout_amounts[i],
        'challenge_payout',
        challenge_id,
        false
      )
      FROM challenge_stats cs
      WHERE cs.challenge_id = challenge_id 
      AND cs.placement = i;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supporting function: Refund all players in case of crash
CREATE OR REPLACE FUNCTION refund_all_challenge_players(
  challenge_id UUID,
  reason TEXT
) RETURNS TABLE(user_id UUID, refund_amount NUMERIC) AS $$
BEGIN
  RETURN QUERY
  WITH refunds AS (
    SELECT 
      cp.user_id,
      cp.stake_paid
    FROM challenge_participants cp
    WHERE cp.challenge_id = refund_all_challenge_players.challenge_id
  )
  SELECT 
    r.user_id,
    r.stake_paid
  FROM refunds r
  WHERE (
    SELECT secure_increment_wallet_balance(
      r.user_id,
      r.stake_paid,
      'crash_refund: ' || reason,
      challenge_id,
      false
    )
  ) IS NOT NULL;
  
  -- Update challenge status
  UPDATE challenges
  SET status = 'refunded'
  WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Event logging function
CREATE OR REPLACE FUNCTION log_market_event(
  match_id UUID,
  event_type TEXT,
  details JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO market_events (
    match_id,
    event_type,
    details
  ) VALUES (
    match_id,
    event_type,
    details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;