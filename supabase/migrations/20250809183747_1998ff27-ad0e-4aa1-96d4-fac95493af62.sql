-- Add secure wallet debit function and encrypted API key storage

-- Create secure wallet debit function 
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
  -- Convert to cents if needed (assuming input is in dollars as cents)
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount_must_be_positive';
  END IF;

  -- Get advisory lock for this user
  PERFORM pg_advisory_xact_lock(hashtext(p_user::text));

  -- Check sufficient balance in profiles table (legacy support)
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_user 
    AND wallet_balance >= (p_amount::numeric / 100) -- Convert cents to dollars
  ) THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Debit from profiles wallet (legacy)
  UPDATE profiles
  SET wallet_balance = wallet_balance - (p_amount::numeric / 100), -- Convert cents to dollars
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

-- Create encrypted API key storage table
CREATE TABLE IF NOT EXISTS encrypted_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  encrypted_key text NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on API keys
ALTER TABLE encrypted_api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
DROP POLICY IF EXISTS api_keys_admin_only ON encrypted_api_keys;
CREATE POLICY api_keys_admin_only ON encrypted_api_keys
FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Helper function to store encrypted API keys
CREATE OR REPLACE FUNCTION store_encrypted_api_key(
  p_provider text, 
  p_key text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Only admins can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  INSERT INTO encrypted_api_keys(provider, encrypted_key, created_by)
  VALUES (p_provider, encode(digest(p_key, 'sha256'), 'base64'), auth.uid())
  ON CONFLICT (provider) DO UPDATE SET
    encrypted_key = EXCLUDED.encrypted_key,
    updated_at = now(),
    created_by = auth.uid()
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;