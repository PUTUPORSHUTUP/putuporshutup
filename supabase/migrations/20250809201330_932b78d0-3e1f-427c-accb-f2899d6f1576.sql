-- 1) RLS POLICIES - Market Tables (Precise Security Patches)

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
USING (player_a = auth.uid() OR player_b = auth.uid() OR is_user_admin());
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
  OR is_user_admin()
);
DROP POLICY IF EXISTS mmr_no_user_write ON market_match_results;
CREATE POLICY mmr_no_user_write ON market_match_results
FOR INSERT, UPDATE, DELETE TO authenticated USING (false) WITH CHECK (false);

-- market_wallets (owner only)
ALTER TABLE market_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mw_read_own ON market_wallets;
CREATE POLICY mw_read_own ON market_wallets
FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_user_admin());
DROP POLICY IF EXISTS mw_update_own ON market_wallets;
CREATE POLICY mw_update_own ON market_wallets
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- make sure none of these are FORCE RLS (definer funcs need bypass)
ALTER TABLE admin_metrics_daily NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_matches NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_match_results NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_wallets NO FORCE ROW LEVEL SECURITY;

-- Legacy tables (if they exist) - enable RLS with proper policies
DO $$
BEGIN
    -- Check if matches table exists and enable RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'matches' AND table_schema = 'public') THEN
        ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS matches_read_participant ON matches;
        CREATE POLICY matches_read_participant ON matches
        FOR SELECT TO authenticated USING (player_a = auth.uid() OR player_b = auth.uid() OR is_user_admin());
        DROP POLICY IF EXISTS matches_no_user_write ON matches;
        CREATE POLICY matches_no_user_write ON matches
        FOR INSERT, UPDATE, DELETE TO authenticated USING (false) WITH CHECK (false);
        ALTER TABLE matches NO FORCE ROW LEVEL SECURITY;
    END IF;

    -- Check if match_results table exists and enable RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_results' AND table_schema = 'public') THEN
        ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS mr_read_scoped ON match_results;
        CREATE POLICY mr_read_scoped ON match_results
        FOR SELECT TO authenticated
        USING (
          user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM matches m
                     WHERE m.id = match_results.match_id
                       AND (m.player_a = auth.uid() OR m.player_b = auth.uid()))
          OR is_user_admin()
        );
        DROP POLICY IF EXISTS mr_no_user_write ON match_results;
        CREATE POLICY mr_no_user_write ON match_results
        FOR INSERT, UPDATE, DELETE TO authenticated USING (false) WITH CHECK (false);
        ALTER TABLE match_results NO FORCE ROW LEVEL SECURITY;
    END IF;

    -- Check if wallets table exists and enable RLS  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets' AND table_schema = 'public') THEN
        ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS wallets_read_own ON wallets;
        CREATE POLICY wallets_read_own ON wallets
        FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_user_admin());
        DROP POLICY IF EXISTS wallets_update_own ON wallets;
        CREATE POLICY wallets_update_own ON wallets
        FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
        ALTER TABLE wallets NO FORCE ROW LEVEL SECURITY;
    END IF;
END $$;