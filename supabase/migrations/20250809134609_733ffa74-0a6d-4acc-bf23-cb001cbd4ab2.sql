-- Fix security issues for PUOSU Market Engine tables
-- Enable RLS and create appropriate policies

-- Enable RLS on market tables
ALTER TABLE market_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_wallet_transactions ENABLE ROW LEVEL SECURITY; 
ALTER TABLE market_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_payouts ENABLE ROW LEVEL SECURITY;

-- Market wallets policies
CREATE POLICY "Users can view their own market wallet" ON market_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all market wallets" ON market_wallets
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Market wallet transactions policies  
CREATE POLICY "Users can view their own market transactions" ON market_wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all market transactions" ON market_wallet_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Market queue policies
CREATE POLICY "Users can view market queue" ON market_queue
  FOR SELECT USING (true);

CREATE POLICY "Service can manage market queue" ON market_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Market matches policies
CREATE POLICY "Users can view market matches" ON market_matches
  FOR SELECT USING (true);

CREATE POLICY "Service can manage market matches" ON market_matches
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Market results policies
CREATE POLICY "Users can view market results" ON market_match_results
  FOR SELECT USING (true);

CREATE POLICY "Service can manage market results" ON market_match_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Market payouts policies
CREATE POLICY "Users can view their own market payouts" ON market_payouts
  FOR SELECT USING (auth.uid() = winner_id);

CREATE POLICY "Service can manage market payouts" ON market_payouts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Test the market engine function
SELECT db_market_run(true);