-- Apply RLS only to tables that actually exist
-- Based on the schema provided, these are the tables I can confirm exist

-- ===============================
-- market_match_results (confirmed exists: user_id, match_id, placement)
-- ===============================
DO $$
BEGIN
  -- Check if table exists and enable RLS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'market_match_results') THEN
    ALTER TABLE market_match_results ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS mmr_read_own_or_admin ON market_match_results;
    CREATE POLICY mmr_read_own_or_admin ON market_match_results
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR is_admin());
    
    DROP POLICY IF EXISTS mmr_no_user_write ON market_match_results;
    CREATE POLICY mmr_no_user_write ON market_match_results
    FOR INSERT TO authenticated
    WITH CHECK (false);
  END IF;
END $$;

-- ===============================
-- security_events (owner: user_id, nullable for anon)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_events') THEN
    ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS se_read_own_or_admin ON security_events;
    CREATE POLICY se_read_own_or_admin ON security_events
    FOR SELECT TO authenticated
    USING ((user_id = auth.uid()) OR is_admin());
    
    DROP POLICY IF EXISTS se_insert_rules ON security_events;
    CREATE POLICY se_insert_rules ON security_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      (current_setting('request.jwt.claims', true) IS NULL AND user_id IS NULL)  -- anon
      OR (auth.uid() IS NOT NULL AND user_id = auth.uid())                       -- logged-in
    );
  END IF;
END $$;

-- ===============================
-- site_visits (owner: user_id nullable; anon allowed)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_visits') THEN
    ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS sv_read_own_or_admin ON site_visits;
    CREATE POLICY sv_read_own_or_admin ON site_visits
    FOR SELECT TO authenticated
    USING ((user_id = auth.uid()) OR is_admin());
    
    DROP POLICY IF EXISTS sv_insert_rules ON site_visits;
    CREATE POLICY sv_insert_rules ON site_visits
    FOR INSERT TO anon, authenticated
    WITH CHECK (
      (auth.uid() IS NULL AND user_id IS NULL)      -- anon visit
      OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    );
  END IF;
END $$;

-- ===============================
-- otp_verifications (sensitive - service_role only)
-- ===============================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'otp_verifications') THEN
    ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS otp_admin_only ON otp_verifications;
    CREATE POLICY otp_admin_only ON otp_verifications
    FOR ALL TO authenticated
    USING (is_admin());
  END IF;
END $$;

-- ===============================
-- Create missing market tables if they don't exist (based on your market engine)
-- ===============================

-- Create market_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS market_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  balance_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and create policies for market_wallets
ALTER TABLE market_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mw_read_own_or_admin ON market_wallets;
CREATE POLICY mw_read_own_or_admin ON market_wallets
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS mw_update_own ON market_wallets;
CREATE POLICY mw_update_own ON market_wallets
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create market_wallet_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS market_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_cents bigint NOT NULL,
  reason text,
  ref_match uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS for wallet transactions
ALTER TABLE market_wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mwt_read_own_or_admin ON market_wallet_transactions;
CREATE POLICY mwt_read_own_or_admin ON market_wallet_transactions
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR is_admin());

-- Create market_matches table if it doesn't exist
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

-- Enable RLS for matches
ALTER TABLE market_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mm_read_participant_or_admin ON market_matches;
CREATE POLICY mm_read_participant_or_admin ON market_matches
FOR SELECT TO authenticated
USING (player_a = auth.uid() OR player_b = auth.uid() OR is_admin());