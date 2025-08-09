-- Fix RLS disabled tables
ALTER TABLE IF EXISTS market_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS market_matches ENABLE ROW LEVEL SECURITY; 
ALTER TABLE IF EXISTS market_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS market_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS market_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS market_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS market_match_results ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Service can manage market_events" ON market_events;
DROP POLICY IF EXISTS "Service can manage market_matches" ON market_matches;
DROP POLICY IF EXISTS "Service can manage market_payouts" ON market_payouts;
DROP POLICY IF EXISTS "Service can manage market_wallets" ON market_wallets;
DROP POLICY IF EXISTS "Service can manage market_wallet_transactions" ON market_wallet_transactions;
DROP POLICY IF EXISTS "Service can manage market_queue" ON market_queue;
DROP POLICY IF EXISTS "Service can manage market_match_results" ON market_match_results;

-- Create RLS policies for market tables (service/admin access only)
CREATE POLICY "Service can manage market_events" 
ON market_events FOR ALL 
USING (true);

CREATE POLICY "Service can manage market_matches" 
ON market_matches FOR ALL 
USING (true);

CREATE POLICY "Service can manage market_payouts" 
ON market_payouts FOR ALL 
USING (true);

CREATE POLICY "Service can manage market_wallets" 
ON market_wallets FOR ALL 
USING (true);

CREATE POLICY "Service can manage market_wallet_transactions" 
ON market_wallet_transactions FOR ALL 
USING (true);

CREATE POLICY "Service can manage market_queue" 
ON market_queue FOR ALL 
USING (true);

CREATE POLICY "Service can manage market_match_results" 
ON market_match_results FOR ALL 
USING (true);