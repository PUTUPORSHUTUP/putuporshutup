-- 3) API Key Storage Security (Xbox & Others) with Encryption

-- Create encrypted API keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL, -- 'xbox', 'stripe', etc.
  enc_key bytea NOT NULL, -- PGP_SYM_ENCRYPT(key, kms_key)
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
CREATE POLICY api_keys_admin_only ON api_keys
FOR ALL TO authenticated
USING (is_user_admin());

-- Helper function to store encrypted API keys
CREATE OR REPLACE FUNCTION api_key_put(p_provider text, p_plain text)
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public' 
AS $$
DECLARE 
  v_id uuid;
  v_kms_key text;
BEGIN
  -- Get KMS key from environment (set by Edge Functions)
  v_kms_key := current_setting('app.kms_key', true);
  
  IF v_kms_key IS NULL OR v_kms_key = '' THEN
    RAISE EXCEPTION 'KMS key not configured';
  END IF;

  INSERT INTO api_keys(provider, enc_key, created_by)
  VALUES (p_provider, pgp_sym_encrypt(p_plain, v_kms_key), auth.uid())
  RETURNING id INTO v_id;
  
  -- Log security event
  INSERT INTO security_events (event_type, user_id, details)
  VALUES ('api_key_stored', auth.uid(), jsonb_build_object('provider', p_provider));
  
  RETURN v_id;
END $$;

-- Helper function to retrieve encrypted API keys (service role only)
CREATE OR REPLACE FUNCTION api_key_get(p_provider text)
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE 
  v_key text;
  v_kms_key text;
BEGIN
  -- Only service role can decrypt keys
  IF NOT is_service_role() THEN
    RAISE EXCEPTION 'Unauthorized access to API keys';
  END IF;

  v_kms_key := current_setting('app.kms_key', true);
  
  IF v_kms_key IS NULL OR v_kms_key = '' THEN
    RAISE EXCEPTION 'KMS key not configured';
  END IF;

  SELECT pgp_sym_decrypt(enc_key, v_kms_key) INTO v_key
  FROM api_keys 
  WHERE provider = p_provider 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  RETURN v_key;
END $$;

-- 4) Fix Security Definer Functions - Set Proper Search Paths
-- Update all existing security definer functions to have proper search_path

-- Fix join_challenge_atomic if it doesn't have proper search path
DROP FUNCTION IF EXISTS join_challenge_atomic(uuid, uuid, numeric);
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

-- Fix other critical security definer functions
CREATE OR REPLACE FUNCTION market_wallet_credit(
  p_user_id uuid, 
  p_amount_cents bigint, 
  p_reason text, 
  p_ref_match uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF p_amount_cents <= 0 THEN
    RAISE EXCEPTION 'amount_must_be_positive';
  END IF;

  INSERT INTO market_wallet_transactions(user_id, amount_cents, reason, ref_match)
  VALUES (p_user_id, p_amount_cents, p_reason, p_ref_match);

  UPDATE market_wallets
  SET balance_cents = balance_cents + p_amount_cents,
      updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Create wallet then credit
    INSERT INTO market_wallets(user_id, balance_cents) 
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO UPDATE SET balance_cents = excluded.balance_cents;

    UPDATE market_wallets
    SET balance_cents = balance_cents + p_amount_cents,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;