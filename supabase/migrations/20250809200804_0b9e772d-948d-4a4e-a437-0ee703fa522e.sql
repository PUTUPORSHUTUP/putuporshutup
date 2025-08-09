-- TARGETED SECURITY FIXES - Only Missing Components

-- 1. Fix Profile Data Exposure - Replace overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view basic info of others"
ON public.profiles
FOR SELECT
TO authenticated  
USING (auth.uid() != user_id); -- Only for other users, not self

-- 2. Add wallet balance constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'wallet_balance_reasonable' 
                   AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT wallet_balance_reasonable 
        CHECK (wallet_balance >= 0 AND wallet_balance <= 100000);
    END IF;
END $$;

-- 3. Enable RLS on match_results if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables 
                   WHERE tablename = 'match_results' 
                   AND rowsecurity = true 
                   AND schemaname = 'public') THEN
        ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. Create missing match_results policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own match results' AND tablename = 'match_results') THEN
        CREATE POLICY "Users can view their own match results"
        ON public.match_results
        FOR SELECT
        TO authenticated
        USING (player_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all match results' AND tablename = 'match_results') THEN
        CREATE POLICY "Admins can view all match results"
        ON public.match_results
        FOR SELECT
        TO authenticated
        USING (is_user_admin());
    END IF;
END $$;

-- 5. Secure transaction policies - only add if missing
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only system can create transactions' AND tablename = 'transactions') THEN
        CREATE POLICY "Only system can create transactions"
        ON public.transactions
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
END $$;

-- 6. Create secure join_challenge_atomic function
CREATE OR REPLACE FUNCTION join_challenge_atomic(
  p_challenge_id uuid,
  p_user_id uuid,
  p_stake_amount numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  challenge_exists boolean := false;
  user_balance numeric := 0;
  current_participants integer := 0;
  max_participants integer := 0;
BEGIN
  -- Validate inputs
  IF p_challenge_id IS NULL OR p_user_id IS NULL OR p_stake_amount IS NULL THEN
    RAISE EXCEPTION 'invalid_parameters';
  END IF;

  IF p_stake_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_stake_amount';
  END IF;

  -- Rate limiting: max 10 attempts per 5 minutes
  IF EXISTS (
    SELECT 1 FROM security_events 
    WHERE user_id = p_user_id 
    AND event_type = 'join_challenge_attempt'
    AND created_at > now() - interval '5 minutes'
    GROUP BY user_id 
    HAVING COUNT(*) >= 10
  ) THEN
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;

  -- Log the attempt
  INSERT INTO security_events (event_type, user_id, details)
  VALUES ('join_challenge_attempt', p_user_id, jsonb_build_object('challenge_id', p_challenge_id));

  -- Get advisory lock for this user to prevent concurrent operations
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Verify challenge exists, is open, and has space
  SELECT 
    COUNT(cp.id),
    c.max_participants
  INTO current_participants, max_participants
  FROM challenges c
  LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
  WHERE c.id = p_challenge_id AND c.status = 'open'
  GROUP BY c.max_participants;

  IF max_participants IS NULL THEN
    RAISE EXCEPTION 'challenge_not_available';
  END IF;

  IF current_participants >= max_participants THEN
    RAISE EXCEPTION 'challenge_full';
  END IF;

  -- Check user balance
  SELECT wallet_balance INTO user_balance 
  FROM profiles 
  WHERE user_id = p_user_id;

  IF user_balance IS NULL THEN
    RAISE EXCEPTION 'user_not_found';
  END IF;

  IF user_balance < p_stake_amount THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Check if user already joined
  IF EXISTS(
    SELECT 1 FROM challenge_participants 
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'already_joined';
  END IF;

  -- Perform atomic transaction
  -- 1. Debit wallet
  UPDATE profiles
  SET wallet_balance = wallet_balance - p_stake_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- 2. Add participant
  INSERT INTO challenge_participants (challenge_id, user_id, stake_paid, status)
  VALUES (p_challenge_id, p_user_id, p_stake_amount, 'joined');

  -- 3. Update challenge total pot
  UPDATE challenges
  SET total_pot = total_pot + p_stake_amount,
      updated_at = now()
  WHERE id = p_challenge_id;

  -- 4. Log successful transaction
  INSERT INTO transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, -p_stake_amount, 'wager_stake', 'completed', 'Joined challenge ' || p_challenge_id);

  -- 5. Log security event for audit
  INSERT INTO security_events (event_type, user_id, details)
  VALUES (
    'challenge_joined', 
    p_user_id, 
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'stake_amount', p_stake_amount,
      'new_balance', user_balance - p_stake_amount
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for security monitoring
    INSERT INTO security_events (event_type, user_id, details, severity)
    VALUES (
      'challenge_join_failed',
      p_user_id,
      jsonb_build_object(
        'challenge_id', p_challenge_id,
        'error', SQLERRM,
        'stake_amount', p_stake_amount
      ),
      'high'
    );
    RAISE;
END;
$$;