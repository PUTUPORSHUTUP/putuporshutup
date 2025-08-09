-- Drop existing wallet_debit_safe function and recreate with correct signature

DROP FUNCTION IF EXISTS wallet_debit_safe(uuid,bigint,text,uuid);

-- Create secure wallet debit function with correct parameters
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