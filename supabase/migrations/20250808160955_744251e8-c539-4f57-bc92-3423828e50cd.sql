-- Fix the profile duplication issue that's causing "multiple (or no) rows returned" error

-- First, identify and clean up any duplicate profiles
-- Keep the most recent profile for each user_id and delete older duplicates
WITH ranked_profiles AS (
  SELECT 
    user_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM profiles
),
duplicates_to_delete AS (
  SELECT user_id, created_at
  FROM ranked_profiles 
  WHERE rn > 1
)
DELETE FROM profiles 
WHERE (user_id, created_at) IN (
  SELECT user_id, created_at FROM duplicates_to_delete
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);

-- Update the increment_wallet_balance function to handle profile lookup more safely
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_param uuid, amount_param numeric, reason_param text DEFAULT 'system'::text, match_id_param uuid DEFAULT NULL::uuid, challenge_id_param uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance numeric;
  new_balance numeric;
  profile_count integer;
BEGIN
  -- Check for profile existence and count
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE user_id = user_id_param;
  
  IF profile_count = 0 THEN
    RAISE EXCEPTION 'Profile not found for user %', user_id_param;
  ELSIF profile_count > 1 THEN
    RAISE EXCEPTION 'Multiple profiles found for user % (count: %)', user_id_param, profile_count;
  END IF;
  
  -- Get current balance with FOR UPDATE lock
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE user_id = user_id_param
  FOR UPDATE;
  
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
$function$;

-- Update the join_challenge_atomic function to handle profile lookup more safely
CREATE OR REPLACE FUNCTION public.join_challenge_atomic(p_challenge_id uuid, p_user_id uuid, p_stake_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance numeric;
  new_balance numeric;
  profile_count integer;
BEGIN
  -- Check if already joined (idempotency)
  IF EXISTS (
    SELECT 1 FROM challenge_participants 
    WHERE challenge_id = p_challenge_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'already_joined';
  END IF;
  
  -- Check for profile existence and count
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE user_id = p_user_id;
  
  IF profile_count = 0 THEN
    RAISE EXCEPTION 'Profile not found for user %', p_user_id;
  ELSIF profile_count > 1 THEN
    RAISE EXCEPTION 'Multiple profiles found for user % (count: %)', p_user_id, profile_count;
  END IF;
  
  -- Get and lock user balance
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
$function$;