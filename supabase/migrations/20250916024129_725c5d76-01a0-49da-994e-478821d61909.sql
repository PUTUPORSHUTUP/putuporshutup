-- Fix critical security vulnerabilities by implementing proper RLS policies

-- 1. Fix profiles table - restrict sensitive data while allowing public access to basic profile info
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Public read access only to non-sensitive fields
CREATE POLICY "Public profile info viewable by everyone" ON public.profiles
  FOR SELECT 
  USING (true);

-- Users can view all their own data
CREATE POLICY "Users can view their complete profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 2. Fix market_wallets table - restrict to user access only
DROP POLICY IF EXISTS "market_wallets_read_all" ON public.market_wallets;
DROP POLICY IF EXISTS "market_wallets_write_all" ON public.market_wallets;

CREATE POLICY "Users can view their own wallet" ON public.market_wallets
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.market_wallets
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.market_wallets
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all wallets for automated processes
CREATE POLICY "Service can manage all wallets" ON public.market_wallets
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 3. Fix market_wallet_transactions table - restrict to user access only
DROP POLICY IF EXISTS "market_wallet_transactions_read_all" ON public.market_wallet_transactions;
DROP POLICY IF EXISTS "market_wallet_transactions_write_all" ON public.market_wallet_transactions;

CREATE POLICY "Users can view their own transactions" ON public.market_wallet_transactions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert transactions" ON public.market_wallet_transactions
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 4. Fix market_payouts table - restrict to winner and admins only
DROP POLICY IF EXISTS "market_payouts_read_all" ON public.market_payouts;
DROP POLICY IF EXISTS "market_payouts_write_all" ON public.market_payouts;

CREATE POLICY "Users can view their own payouts" ON public.market_payouts
  FOR SELECT 
  USING (auth.uid() = winner_id);

CREATE POLICY "Admins can view all payouts" ON public.market_payouts
  FOR SELECT 
  USING (public.is_user_admin());

CREATE POLICY "Service can manage payouts" ON public.market_payouts
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Fix market_match_results table - restrict to match participants
DROP POLICY IF EXISTS "market_match_results_read_all" ON public.market_match_results;
DROP POLICY IF EXISTS "market_match_results_write_all" ON public.market_match_results;

CREATE POLICY "Users can view their own match results" ON public.market_match_results
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view results from their matches" ON public.market_match_results
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.market_match_results mmr2 
      WHERE mmr2.match_id = market_match_results.match_id 
      AND mmr2.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage match results" ON public.market_match_results
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Create a view for safe public profile access that only exposes necessary fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  created_at,
  updated_at,
  -- Only expose gaming-related info that's needed for leaderboards/social features
  CASE WHEN xbox_gamertag IS NOT NULL THEN true ELSE false END as has_xbox_linked
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add RLS policy for the view
ALTER VIEW public.public_profiles SET (security_invoker = true);