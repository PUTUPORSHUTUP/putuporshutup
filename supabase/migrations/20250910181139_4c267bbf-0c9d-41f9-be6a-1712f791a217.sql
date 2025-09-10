-- PUOSU Wallet System - Backend Enforcement Functions

-- Function to safely deduct entry fee with balance validation
CREATE OR REPLACE FUNCTION deduct_entry_fee_safe(
  p_user_id UUID,
  p_entry_fee NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get advisory lock for this user to prevent concurrent operations
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  
  -- Validate input
  IF p_entry_fee <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid entry fee',
      'code', 'INVALID_AMOUNT'
    );
  END IF;
  
  -- Get current balance with row lock
  SELECT wallet_balance INTO v_current_balance
  FROM profiles 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found',
      'code', 'USER_NOT_FOUND'
    );
  END IF;
  
  -- PUOSU Rule: Wallet Balance ≥ Match Entry Fee
  IF v_current_balance < p_entry_fee THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient funds',
      'code', 'INSUFFICIENT_BALANCE',
      'current_balance', v_current_balance,
      'required', p_entry_fee,
      'shortfall', p_entry_fee - v_current_balance
    );
  END IF;
  
  -- Deduct entry fee
  v_new_balance := v_current_balance - p_entry_fee;
  
  UPDATE profiles 
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO transactions (
    user_id, 
    amount, 
    type, 
    status, 
    description
  ) VALUES (
    p_user_id,
    -p_entry_fee,
    'entry_fee',
    'completed',
    'Match entry fee deducted'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'entry_fee_deducted', p_entry_fee
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM,
      'code', 'DB_ERROR'
    );
END;
$$;

-- Function to refund entry fee (for failed matches)
CREATE OR REPLACE FUNCTION refund_entry_fee(
  p_user_id UUID,
  p_entry_fee NUMERIC,
  p_reason TEXT DEFAULT 'Match cancelled'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get advisory lock for this user
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));
  
  -- Get current balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles 
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;
  
  -- Refund entry fee
  v_new_balance := v_current_balance + p_entry_fee;
  
  UPDATE profiles 
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Log refund transaction
  INSERT INTO transactions (
    user_id, 
    amount, 
    type, 
    status, 
    description
  ) VALUES (
    p_user_id,
    p_entry_fee,
    'refund',
    'completed',
    p_reason
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'refund_amount', p_entry_fee
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
END;
$$;

-- Function to get match eligibility for a user (PUOSU rules)
CREATE OR REPLACE FUNCTION get_match_eligibility(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
  v_eligibility JSONB;
BEGIN
  -- Get user balance
  SELECT wallet_balance INTO v_balance
  FROM profiles 
  WHERE user_id = p_user_id;
  
  IF v_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;
  
  -- PUOSU Dynamic Match Eligibility Rules
  v_eligibility := jsonb_build_object(
    'current_balance', v_balance,
    'can_join_1_dollar', v_balance >= 1,
    'can_join_3_dollar', v_balance >= 3,
    'can_join_5_dollar', v_balance >= 5,
    'can_join_10_dollar', v_balance >= 10,
    'available_matches', CASE 
      WHEN v_balance >= 10 THEN '[1, 3, 5, 10]'::jsonb
      WHEN v_balance >= 5 THEN '[1, 3, 5]'::jsonb
      WHEN v_balance >= 3 THEN '[1, 3]'::jsonb
      WHEN v_balance >= 1 THEN '[1]'::jsonb
      ELSE '[]'::jsonb
    END,
    'banner_message', CASE
      WHEN v_balance = 0 THEN '🚨 Balance empty. Top up to compete again.'
      WHEN v_balance < 5 AND v_balance >= 1 THEN '⚠️ Low balance: only $1 matches available until you top up.'
      ELSE NULL
    END,
    'banner_type', CASE
      WHEN v_balance = 0 THEN 'error'
      WHEN v_balance < 5 AND v_balance >= 1 THEN 'warning'
      ELSE NULL
    END
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'eligibility', v_eligibility
  );
  
END;
$$;