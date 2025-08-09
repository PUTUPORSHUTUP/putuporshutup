-- Critical Security Fixes: Enable RLS on unprotected tables

-- admin_metrics_daily (read-only for users, admin+service full)
ALTER TABLE admin_metrics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS amd_read_all ON admin_metrics_daily;
CREATE POLICY amd_read_all ON admin_metrics_daily
FOR SELECT TO authenticated USING (true);
-- no user writes
DROP POLICY IF EXISTS amd_no_user_write ON admin_metrics_daily;
CREATE POLICY amd_no_user_write ON admin_metrics_daily
FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (false);

-- market_matches (participants only)
ALTER TABLE market_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mm_read_participant ON market_matches;
CREATE POLICY mm_read_participant ON market_matches
FOR SELECT TO authenticated
USING (player_a = auth.uid() OR player_b = auth.uid() OR is_admin());
-- user writes denied; service runs via SECURITY DEFINER
DROP POLICY IF EXISTS mm_no_user_write ON market_matches;
CREATE POLICY mm_no_user_write ON market_matches
FOR INSERT, UPDATE, DELETE TO authenticated USING (false) WITH CHECK (false);

-- market_match_results (self or match participants)
ALTER TABLE market_match_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mmr_read_scoped ON market_match_results;
CREATE POLICY mmr_read_scoped ON market_match_results
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM market_matches m
             WHERE m.id = market_match_results.match_id
               AND (m.player_a = auth.uid() OR m.player_b = auth.uid()))
  OR is_admin()
);
DROP POLICY IF EXISTS mmr_no_user_write ON market_match_results;
CREATE POLICY mmr_no_user_write ON market_match_results
FOR INSERT, UPDATE, DELETE TO authenticated USING (false) WITH CHECK (false);

-- market_wallets (owner only)
ALTER TABLE market_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mw_read_own ON market_wallets;
CREATE POLICY mw_read_own ON market_wallets
FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS mw_update_own ON market_wallets;
CREATE POLICY mw_update_own ON market_wallets
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Ensure none are FORCE RLS (definer funcs need bypass)
ALTER TABLE admin_metrics_daily NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_matches NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_match_results NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_wallets NO FORCE ROW LEVEL SECURITY;

-- Add secure wallet debit function
CREATE OR REPLACE FUNCTION market_wallet_debit_safe(
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

  -- Get advisory lock for this user
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Check sufficient balance
  IF NOT EXISTS (
    SELECT 1 FROM market_wallets 
    WHERE user_id = p_user_id 
    AND balance_cents >= p_amount_cents
  ) THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  -- Log transaction first
  INSERT INTO market_wallet_transactions(user_id, amount_cents, reason, ref_match)
  VALUES (p_user_id, -p_amount_cents, p_reason, p_ref_match);

  -- Debit wallet
  UPDATE market_wallets
  SET balance_cents = balance_cents - p_amount_cents,
      updated_at = now()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;
END;
$$;

-- Add encrypted API key storage
CREATE TABLE IF NOT EXISTS encrypted_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider)
);

-- Enable RLS on API keys
ALTER TABLE encrypted_api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can manage API keys
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