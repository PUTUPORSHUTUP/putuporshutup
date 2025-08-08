-- Final authorization and monitoring fixes for sim automation
BEGIN;

-- Ensure robust service role function
CREATE OR REPLACE FUNCTION is_service_role() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  );
$$;

-- Grant explicit service role permissions
GRANT ALL ON payout_automation_log TO service_role;
GRANT ALL ON challenges TO service_role;  
GRANT ALL ON challenge_participants TO service_role;
GRANT ALL ON challenge_stats TO service_role;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON wallet_transactions TO service_role;

-- Add monitoring index for better performance
CREATE INDEX IF NOT EXISTS idx_payout_log_entity_type_status 
ON payout_automation_log(entity_id, entity_type, event_type, status);

-- Update the increment_wallet_balance function to ensure it's secure
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  user_id_param uuid, 
  amount_param numeric, 
  reason_param text DEFAULT 'system'::text, 
  match_id_param uuid DEFAULT NULL::uuid, 
  challenge_id_param uuid DEFAULT NULL::uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  -- Get current balance and update atomically
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE user_id = user_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', user_id_param;
  END IF;
  
  new_balance := COALESCE(current_balance, 0) + amount_param;
  
  -- Prevent negative balance
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', current_balance, amount_param;
  END IF;
  
  -- Update balance
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Log transaction
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    match_id,
    challenge_id,
    balance_before,
    balance_after
  ) VALUES (
    user_id_param,
    amount_param,
    CASE WHEN amount_param >= 0 THEN 'credit' ELSE 'debit' END,
    reason_param,
    match_id_param,
    challenge_id_param,
    COALESCE(current_balance, 0),
    new_balance
  );
END;
$$;

COMMIT;