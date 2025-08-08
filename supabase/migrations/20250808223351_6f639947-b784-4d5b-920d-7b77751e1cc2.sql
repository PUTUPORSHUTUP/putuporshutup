-- First ensure we have a system user that can create challenges
INSERT INTO profiles (
  user_id, 
  username, 
  display_name, 
  xbox_gamertag, 
  wallet_balance,
  is_test_account,
  is_admin
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'system_admin',
  'System Admin',
  'SystemAdmin',
  999999.99,
  false,
  true
) ON CONFLICT (user_id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  is_admin = true,
  wallet_balance = GREATEST(profiles.wallet_balance, 999999.99);

-- Update atomic_market_cycle to handle the foreign key constraint properly
CREATE OR REPLACE FUNCTION public.atomic_market_cycle(
  min_players integer DEFAULT 6, 
  crash_rate numeric DEFAULT 0.05, 
  force_no_crash boolean DEFAULT true
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  payout_count INTEGER := 0;
  system_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Start atomic transaction
  BEGIN
    -- Verify system user exists, if not create it
    INSERT INTO profiles (
      user_id, 
      username, 
      display_name, 
      wallet_balance,
      is_test_account,
      is_admin
    ) VALUES (
      system_user_id,
      'system_admin',
      'System Admin',
      999999.99,
      false,
      true
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- 1. Get random active game (using correct column names)
    SELECT id, display_name, description INTO selected_game
    FROM games 
    WHERE is_active = true 
    ORDER BY random() 
    LIMIT 1;
    
    IF selected_game.id IS NULL THEN
      RAISE EXCEPTION 'No active games found';
    END IF;
    
    -- 2. Create challenge (using display_name instead of title)
    INSERT INTO challenges (
      title,
      description,
      game_id,
      challenge_type,
      stake_amount,
      max_participants,
      status,
      creator_id,
      platform
    ) VALUES (
      'Atomic Market ' || selected_game.display_name || ' - ' || NOW()::TEXT,
      'Automated atomic market cycle challenge',
      selected_game.id,
      CASE WHEN min_players = 2 THEN '1v1' ELSE 'multiplayer' END,
      5.00,
      min_players,
      'open',
      system_user_id,
      'multi'
    ) RETURNING id INTO challenge_id;
    
    -- 3. Get available test users (with lock to prevent race conditions)
    SELECT array_agg(user_id) INTO user_ids
    FROM (
      SELECT user_id 
      FROM profiles
      WHERE is_test_account = true
      AND wallet_balance >= 5.00
      ORDER BY COALESCE(updated_at, created_at), created_at
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
    
    -- 5. Determine if we should crash (for testing)
    should_crash := NOT force_no_crash AND random() < crash_rate;
    
    IF should_crash THEN
      -- Simulate crash scenario - refund all players
      FOR i IN 1..participants_count LOOP
        PERFORM secure_increment_wallet_balance(
          user_ids[i], 
          5.00, 
          'challenge_refund', 
          challenge_id, 
          true
        );
        refund_count := refund_count + 1;
      END LOOP;
      
      UPDATE challenges SET status = 'cancelled' WHERE id = challenge_id;
      
      RETURN jsonb_build_object(
        'success', true,
        'challenge_id', challenge_id,
        'crashed', true,
        'refund_count', refund_count,
        'participants', participants_count,
        'message', 'Challenge crashed - all players refunded'
      );
    END IF;
    
    -- 6. Generate results (create stats for each participant)
    FOR i IN 1..participants_count LOOP
      INSERT INTO challenge_stats (
        challenge_id,
        user_id,
        kills,
        deaths,
        assists,
        score,
        placement,
        verified
      ) VALUES (
        challenge_id,
        user_ids[i],
        floor(random() * 20 + 5)::integer,  -- 5-25 kills
        floor(random() * 15 + 2)::integer,  -- 2-17 deaths  
        floor(random() * 10 + 1)::integer,  -- 1-11 assists
        floor(random() * 5000 + 1000)::integer, -- 1000-6000 score
        i, -- placement 1, 2, 3, etc.
        true
      );
    END LOOP;
    
    -- 7. Process payouts using new safe payout function
    SELECT db_market_payout_safe(challenge_id, (total_pot * 100)::bigint) INTO payout_count;
    
    -- Mark as settled
    PERFORM secure_settle_challenge(challenge_id);
    
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
    
    -- Success!
    RETURN jsonb_build_object(
      'success', true,
      'challenge_id', challenge_id,
      'crashed', false,
      'participants', participants_count,
      'total_pot', total_pot,
      'winner', jsonb_build_object('user_id', winner_record.user_id, 'score', winner_record.score),
      'payout_count', payout_count,
      'message', 'Atomic market cycle completed successfully'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Automatic rollback happens here
    RAISE EXCEPTION 'Atomic market cycle failed: %', SQLERRM;
  END;
END;
$$;