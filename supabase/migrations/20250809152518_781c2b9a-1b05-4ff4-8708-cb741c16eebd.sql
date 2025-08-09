-- Apply RLS using correct column names based on actual schema

-- ===============================
-- market_match_results (has: user_id, match_id, placement)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_match_results') THEN
    ALTER TABLE market_match_results ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS mmr_read_own_or_admin ON market_match_results;
    CREATE POLICY mmr_read_own_or_admin ON market_match_results
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());
    
    DROP POLICY IF EXISTS mmr_service_write ON market_match_results;
    CREATE POLICY mmr_service_write ON market_match_results
    FOR INSERT TO authenticated
    WITH CHECK (false);  -- Only service_role can insert
  END IF;
END $$;

-- ===============================
-- security_events (has: user_id nullable, event_type, details)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_events') THEN
    ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS se_read_own_or_admin ON security_events;
    CREATE POLICY se_read_own_or_admin ON security_events
    FOR SELECT TO authenticated
    USING ((user_id = auth.uid()) OR is_admin());
    
    DROP POLICY IF EXISTS se_insert_controlled ON security_events;
    CREATE POLICY se_insert_controlled ON security_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      (current_setting('request.jwt.claims', true) IS NULL AND user_id IS NULL)  -- anon
      OR (auth.uid() IS NOT NULL AND user_id = auth.uid())                       -- logged-in
    );
  END IF;
END $$;

-- ===============================
-- site_visits (has: visitor_id, NOT user_id)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_visits') THEN
    ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
    
    -- Site visits are generally public for analytics
    DROP POLICY IF EXISTS sv_public_read ON site_visits;
    CREATE POLICY sv_public_read ON site_visits
    FOR SELECT TO authenticated
    USING (true);  -- Admins can view all visits
    
    DROP POLICY IF EXISTS sv_anon_insert ON site_visits;
    CREATE POLICY sv_anon_insert ON site_visits
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);  -- Allow visit logging
  END IF;
END $$;

-- ===============================
-- otp_verifications (has: user_id, otp_code - sensitive)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_verifications') THEN
    ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
    
    -- Only service_role and admins should access OTP data
    DROP POLICY IF EXISTS otp_restricted_access ON otp_verifications;
    CREATE POLICY otp_restricted_access ON otp_verifications
    FOR ALL TO authenticated
    USING (is_admin());
    
    DROP POLICY IF EXISTS otp_no_user_access ON otp_verifications;
    CREATE POLICY otp_no_user_access ON otp_verifications
    FOR SELECT TO authenticated
    USING (false);  -- Users cannot read OTP data directly
  END IF;
END $$;

-- ===============================
-- Create and secure market tables for the market engine
-- ===============================

-- Market wallets table
CREATE TABLE IF NOT EXISTS market_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  balance_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT positive_balance CHECK (balance_cents >= 0)
);

ALTER TABLE market_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mw_read_own_or_admin ON market_wallets;
CREATE POLICY mw_read_own_or_admin ON market_wallets
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Market wallet transactions
CREATE TABLE IF NOT EXISTS market_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  reason text NOT NULL DEFAULT 'transaction',
  ref_match uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mwt_read_own_or_admin ON market_wallet_transactions;
CREATE POLICY mwt_read_own_or_admin ON market_wallet_transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Market matches
CREATE TABLE IF NOT EXISTS market_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  game_key text NOT NULL,
  stake_cents bigint NOT NULL,
  player_a uuid NOT NULL,
  player_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mm_read_participants_or_admin ON market_matches;
CREATE POLICY mm_read_participants_or_admin ON market_matches
FOR SELECT TO authenticated
USING (player_a = auth.uid() OR player_b = auth.uid() OR is_admin());

-- Market queue
CREATE TABLE IF NOT EXISTS market_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game_key text NOT NULL,
  stake_cents bigint NOT NULL,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE market_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mq_read_own_or_admin ON market_queue;
CREATE POLICY mq_read_own_or_admin ON market_queue
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS mq_manage_own ON market_queue;
CREATE POLICY mq_manage_own ON market_queue
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());