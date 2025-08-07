-- Create atomic join function for idempotent challenge joining
CREATE OR REPLACE FUNCTION join_challenge_atomic(
  p_challenge_id uuid,
  p_user_id uuid,
  p_stake_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  -- Check if already joined (idempotency)
  IF EXISTS (
    SELECT 1 FROM challenge_participants 
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'already_joined';
  END IF;
  
  -- Get and lock user balance
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
  
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
  
  -- Log wallet transaction
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
END;
$$;