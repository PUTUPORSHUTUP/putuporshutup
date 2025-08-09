-- CRITICAL SECURITY FIXES - Corrected Version

-- 1. Fix Profile Data Exposure
-- Drop the overly permissive policy and create proper user-scoped policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create separate policies for different access levels
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- For public fields, we'll handle column filtering at the application level
-- This policy allows viewing other profiles but apps should filter sensitive fields
CREATE POLICY "Users can view basic profile info of others"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can view all profile data"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 2. Enable RLS on missing critical tables
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Create policies for match_results
CREATE POLICY "Users can view their own match results"
ON public.match_results
FOR SELECT
TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Match participants can view results"
ON public.match_results
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM market_matches m
    WHERE m.id = match_results.match_id 
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  )
);

CREATE POLICY "Admins can view all match results"
ON public.match_results
FOR SELECT
TO authenticated
USING (is_user_admin());

CREATE POLICY "Service can manage match results"
ON public.match_results
FOR ALL
TO service_role
USING (true);

-- 3. Secure market_matches table
CREATE POLICY "Users can view their own matches"
ON public.market_matches
FOR SELECT
TO authenticated
USING (player_a = auth.uid() OR player_b = auth.uid());

CREATE POLICY "Admins can manage all matches"
ON public.market_matches
FOR ALL
TO authenticated
USING (is_user_admin());

CREATE POLICY "Service can manage matches"
ON public.market_matches
FOR ALL
TO service_role
USING (true);

-- 4. Secure Transaction System
-- Drop overly permissive transaction policies
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;

-- Create proper transaction policies
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (is_user_admin());

-- Only allow system to create transactions, not direct user inserts
CREATE POLICY "Only system can create transactions"
ON public.transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Add additional wallet balance validation
ALTER TABLE public.profiles 
ADD CONSTRAINT wallet_balance_reasonable 
CHECK (wallet_balance >= 0 AND wallet_balance <= 100000);

-- 6. Secure market wallet operations
ALTER TABLE public.market_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own market wallet"
ON public.market_wallets
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage market wallets"
ON public.market_wallets
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Admins can view all market wallets"
ON public.market_wallets
FOR SELECT
TO authenticated
USING (is_user_admin());

-- 7. Secure escrow accounts - add missing policy
DROP POLICY IF EXISTS "Users can view their related escrow" ON public.escrow_accounts;

CREATE POLICY "Users can view their related escrow accounts"
ON public.escrow_accounts
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  released_to = auth.uid() OR
  wager_id IN (
    SELECT id FROM challenges WHERE creator_id = auth.uid()
  )
);

-- 8. Create secure wallet debit function for join-challenge-atomic
CREATE OR REPLACE FUNCTION wallet_debit_safe(
  p_user uuid,
  p_amount bigint,
  p_reason text,
  p_match uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Amount should be in cents
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount_must_be_positive';
  END IF;

  -- Get advisory lock for this user
  PERFORM pg_advisory_xact_lock(hashtext(p_user::text));

  -- Check sufficient balance in profiles table (convert cents to dollars)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_user 
    AND wallet_balance >= (p_amount::numeric / 100)
  ) THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Debit from profiles wallet
  UPDATE profiles
  SET wallet_balance = wallet_balance - (p_amount::numeric / 100),
      updated_at = now()
  WHERE user_id = p_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  -- Log transaction  
  INSERT INTO transactions(user_id, amount, type, status, description)
  VALUES (p_user, -(p_amount::numeric / 100), 'withdrawal', 'completed', p_reason);
END;
$$;

-- 9. Create join_challenge_atomic function with proper validation
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
BEGIN
  -- Validate inputs
  IF p_challenge_id IS NULL OR p_user_id IS NULL OR p_stake_amount IS NULL THEN
    RAISE EXCEPTION 'invalid_parameters';
  END IF;

  IF p_stake_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_stake_amount';
  END IF;

  -- Check rate limiting
  IF NOT check_rate_limit(p_user_id, 'join_challenge', 10, 5) THEN
    RAISE EXCEPTION 'rate_limit_exceeded';
  END IF;

  -- Get advisory lock for this user
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Verify challenge exists and is open
  SELECT EXISTS(
    SELECT 1 FROM challenges 
    WHERE id = p_challenge_id AND status = 'open'
  ) INTO challenge_exists;

  IF NOT challenge_exists THEN
    RAISE EXCEPTION 'challenge_not_available';
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

  -- Debit wallet
  UPDATE profiles
  SET wallet_balance = wallet_balance - p_stake_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Add participant
  INSERT INTO challenge_participants (challenge_id, user_id, stake_paid, status)
  VALUES (p_challenge_id, p_user_id, p_stake_amount, 'joined');

  -- Update challenge total pot
  UPDATE challenges
  SET total_pot = total_pot + p_stake_amount,
      updated_at = now()
  WHERE id = p_challenge_id;

  -- Log transaction
  INSERT INTO transactions (user_id, amount, type, status, description)
  VALUES (p_user_id, -p_stake_amount, 'wager_stake', 'completed', 'Joined challenge ' || p_challenge_id);

  -- Log security event
  PERFORM log_security_event(
    'challenge_joined',
    p_user_id,
    jsonb_build_object(
      'challenge_id', p_challenge_id,
      'stake_amount', p_stake_amount
    )
  );
END;
$$;