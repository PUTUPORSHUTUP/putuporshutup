-- Create secure atomic challenge joining function
CREATE OR REPLACE FUNCTION public.secure_join_challenge_atomic(
  p_challenge_id uuid, 
  p_user_id uuid, 
  p_stake_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
  result jsonb;
BEGIN
  -- Verify user is authenticated
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'unauthorized_access';
  END IF;
  
  -- Check if already joined (idempotency)
  IF EXISTS (
    SELECT 1 FROM challenge_participants 
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'already_joined';
  END IF;
  
  -- Get and lock user balance atomically
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient funds
  IF COALESCE(current_balance, 0) < p_stake_amount THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;
  
  new_balance := current_balance - p_stake_amount;
  
  -- Update balance atomically
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Join challenge
  INSERT INTO challenge_participants (
    challenge_id,
    user_id,
    stake_paid,
    status
  ) VALUES (
    p_challenge_id,
    p_user_id,
    p_stake_amount,
    'joined'
  );
  
  -- Log transaction
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    challenge_id,
    balance_before,
    balance_after
  ) VALUES (
    p_user_id,
    -p_stake_amount,
    'debit',
    'join_challenge',
    p_challenge_id,
    current_balance,
    new_balance
  );
  
  result := jsonb_build_object(
    'success', true,
    'new_balance', new_balance,
    'stake_paid', p_stake_amount
  );
  
  RETURN result;
END;
$$;

-- Create secure challenge settlement function
CREATE OR REPLACE FUNCTION public.secure_settle_challenge(
  p_challenge_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  already_settled boolean := false;
BEGIN
  -- Only service role or admin can settle challenges
  IF NOT (is_service_role() OR is_user_admin()) THEN
    RAISE EXCEPTION 'unauthorized_settlement';
  END IF;
  
  -- Check if already settled
  SELECT (settled_at IS NOT NULL) INTO already_settled
  FROM challenges 
  WHERE id = p_challenge_id;
  
  IF already_settled THEN
    RETURN false; -- Already processed
  END IF;
  
  -- Mark as settled atomically
  UPDATE challenges 
  SET settled_at = now(),
      settlement_attempts = settlement_attempts + 1,
      status = 'settled'
  WHERE id = p_challenge_id AND settled_at IS NULL;
  
  RETURN FOUND; -- Returns true if we successfully marked it
END;
$$;

-- Create secure wallet increment function with proper authorization
CREATE OR REPLACE FUNCTION public.secure_increment_wallet_balance(
  p_user_id uuid, 
  p_amount numeric, 
  p_reason text DEFAULT 'system',
  p_challenge_id uuid DEFAULT NULL,
  p_requires_admin boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
  result jsonb;
BEGIN
  -- Authorization checks
  IF p_requires_admin AND NOT (is_service_role() OR is_user_admin()) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;
  
  -- Prevent negative balance
  IF p_amount < 0 THEN
    SELECT wallet_balance INTO current_balance
    FROM profiles
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    IF COALESCE(current_balance, 0) + p_amount < 0 THEN
      RAISE EXCEPTION 'insufficient_balance';
    END IF;
  ELSE
    -- For positive amounts, still lock the row
    SELECT wallet_balance INTO current_balance
    FROM profiles
    WHERE user_id = p_user_id
    FOR UPDATE;
  END IF;
  
  new_balance := COALESCE(current_balance, 0) + p_amount;
  
  -- Update balance atomically
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    challenge_id,
    balance_before,
    balance_after
  ) VALUES (
    p_user_id,
    p_amount,
    CASE WHEN p_amount >= 0 THEN 'credit' ELSE 'debit' END,
    p_reason,
    p_challenge_id,
    COALESCE(current_balance, 0),
    new_balance
  );
  
  result := jsonb_build_object(
    'success', true,
    'old_balance', COALESCE(current_balance, 0),
    'new_balance', new_balance,
    'amount_processed', p_amount
  );
  
  RETURN result;
END;
$$;