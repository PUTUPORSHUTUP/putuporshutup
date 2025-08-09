-- Critical Security Fixes: Enable RLS on unprotected tables

-- admin_metrics_daily (read-only for users, admin+service full)
ALTER TABLE admin_metrics_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS amd_read_all ON admin_metrics_daily;
CREATE POLICY amd_read_all ON admin_metrics_daily
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS amd_no_user_insert ON admin_metrics_daily;
CREATE POLICY amd_no_user_insert ON admin_metrics_daily
FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS amd_no_user_update ON admin_metrics_daily;
CREATE POLICY amd_no_user_update ON admin_metrics_daily
FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS amd_no_user_delete ON admin_metrics_daily;
CREATE POLICY amd_no_user_delete ON admin_metrics_daily
FOR DELETE TO authenticated USING (false);

-- market_matches (participants only)
ALTER TABLE market_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mm_read_participant ON market_matches;
CREATE POLICY mm_read_participant ON market_matches
FOR SELECT TO authenticated
USING (player_a = auth.uid() OR player_b = auth.uid() OR is_admin());

DROP POLICY IF EXISTS mm_no_user_insert ON market_matches;
CREATE POLICY mm_no_user_insert ON market_matches
FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS mm_no_user_update ON market_matches;
CREATE POLICY mm_no_user_update ON market_matches
FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS mm_no_user_delete ON market_matches;
CREATE POLICY mm_no_user_delete ON market_matches
FOR DELETE TO authenticated USING (false);

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

DROP POLICY IF EXISTS mmr_no_user_insert ON market_match_results;
CREATE POLICY mmr_no_user_insert ON market_match_results
FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS mmr_no_user_update ON market_match_results;
CREATE POLICY mmr_no_user_update ON market_match_results
FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS mmr_no_user_delete ON market_match_results;
CREATE POLICY mmr_no_user_delete ON market_match_results
FOR DELETE TO authenticated USING (false);

-- market_wallets (owner only)
ALTER TABLE market_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mw_read_own ON market_wallets;
CREATE POLICY mw_read_own ON market_wallets
FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS mw_update_own ON market_wallets;
CREATE POLICY mw_update_own ON market_wallets
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS mw_no_user_insert ON market_wallets;
CREATE POLICY mw_no_user_insert ON market_wallets
FOR INSERT TO authenticated WITH CHECK (false);

DROP POLICY IF EXISTS mw_no_user_delete ON market_wallets;
CREATE POLICY mw_no_user_delete ON market_wallets
FOR DELETE TO authenticated USING (false);

-- Ensure none are FORCE RLS (definer funcs need bypass)
ALTER TABLE admin_metrics_daily NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_matches NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_match_results NO FORCE ROW LEVEL SECURITY;
ALTER TABLE market_wallets NO FORCE ROW LEVEL SECURITY;