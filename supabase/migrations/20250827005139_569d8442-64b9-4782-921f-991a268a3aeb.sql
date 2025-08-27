-- Fix critical security issues identified by Supabase security advisor

-- 1. Add RLS policies for market wallet tables
-- Enable RLS for market_wallets if not already enabled
ALTER TABLE IF EXISTS market_wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_wallets
DROP POLICY IF EXISTS "Users can view their own wallet" ON market_wallets;
CREATE POLICY "Users can view their own wallet" 
ON market_wallets FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage wallets" ON market_wallets;
CREATE POLICY "Service role can manage wallets" 
ON market_wallets FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS for market_wallet_transactions if not already enabled
ALTER TABLE IF EXISTS market_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_wallet_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON market_wallet_transactions;
CREATE POLICY "Users can view their own transactions" 
ON market_wallet_transactions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage transactions" ON market_wallet_transactions;
CREATE POLICY "Service role can manage transactions" 
ON market_wallet_transactions FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS for market_payouts if not already enabled
ALTER TABLE IF EXISTS market_payouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_payouts
DROP POLICY IF EXISTS "Users can view their own payouts" ON market_payouts;
CREATE POLICY "Users can view their own payouts" 
ON market_payouts FOR SELECT 
USING (auth.uid() = winner_id);

DROP POLICY IF EXISTS "Service role can manage payouts" ON market_payouts;
CREATE POLICY "Service role can manage payouts" 
ON market_payouts FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. Add RLS policies for match-related tables
-- Enable RLS for market_matches if not already enabled
ALTER TABLE IF EXISTS market_matches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_matches
DROP POLICY IF EXISTS "Users can view matches they participate in" ON market_matches;
CREATE POLICY "Users can view matches they participate in" 
ON market_matches FOR SELECT 
USING (auth.uid() = player_a OR auth.uid() = player_b);

DROP POLICY IF EXISTS "Service role can manage matches" ON market_matches;
CREATE POLICY "Service role can manage matches" 
ON market_matches FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS for market_match_results if not already enabled
ALTER TABLE IF EXISTS market_match_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for market_match_results
DROP POLICY IF EXISTS "Users can view their own match results" ON market_match_results;
CREATE POLICY "Users can view their own match results" 
ON market_match_results FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage match results" ON market_match_results;
CREATE POLICY "Service role can manage match results" 
ON market_match_results FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Enable RLS for match_queue if not already enabled
ALTER TABLE IF EXISTS match_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for match_queue
DROP POLICY IF EXISTS "Users can view their own queue entries" ON match_queue;
CREATE POLICY "Users can view their own queue entries" 
ON match_queue FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own queue entries" ON match_queue;
CREATE POLICY "Users can manage their own queue entries" 
ON match_queue FOR ALL 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage queue" ON match_queue;
CREATE POLICY "Service role can manage queue" 
ON match_queue FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Secure site_visits table
-- Enable RLS for site_visits if not already enabled
ALTER TABLE IF EXISTS site_visits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for site_visits (admin only access)
DROP POLICY IF EXISTS "Admins can view site visits" ON site_visits;
CREATE POLICY "Admins can view site visits" 
ON site_visits FOR SELECT 
USING (is_user_admin());

DROP POLICY IF EXISTS "Service role can manage site visits" ON site_visits;
CREATE POLICY "Service role can manage site visits" 
ON site_visits FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Check if public_profiles table exists and secure it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'public_profiles') THEN
        ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own public profile" ON public_profiles;
        CREATE POLICY "Users can view their own public profile" 
        ON public_profiles FOR SELECT 
        USING (auth.uid() = user_id);
        
        DROP POLICY IF EXISTS "Service role can manage public profiles" ON public_profiles;
        CREATE POLICY "Service role can manage public profiles" 
        ON public_profiles FOR ALL 
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;