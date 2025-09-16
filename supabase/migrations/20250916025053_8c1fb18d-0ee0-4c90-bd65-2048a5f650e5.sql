-- COMPREHENSIVE SECURITY FIX - Remove all public access to sensitive data
-- First fix the duplicate admin function issue, then secure all tables

-- =============================================================================
-- FIX DUPLICATE ADMIN FUNCTION ISSUE
-- =============================================================================

-- Drop duplicate functions and create one canonical version
DROP FUNCTION IF EXISTS public.is_user_admin();
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Create the canonical admin check function
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- =============================================================================
-- PROFILES TABLE - Fix Customer Personal Information Exposure
-- =============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;

-- Create secure policies for profiles
CREATE POLICY "Users can view their own complete profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (public.is_user_admin());

-- =============================================================================
-- MARKET WALLETS TABLE - Fix User Financial Information Exposure
-- =============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "market_wallets_read_all" ON public.market_wallets;
DROP POLICY IF EXISTS "Users can view market wallets" ON public.market_wallets;

-- Create secure policy for market wallets
CREATE POLICY "Users can view their own wallet" ON public.market_wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.market_wallets
  FOR SELECT USING (public.is_user_admin());

-- =============================================================================
-- MARKET WALLET TRANSACTIONS TABLE - Fix Financial Transaction History Exposure
-- =============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "market_wallet_transactions_read_all" ON public.market_wallet_transactions;
DROP POLICY IF EXISTS "Users can view market wallet transactions" ON public.market_wallet_transactions;

-- Create secure policy for wallet transactions
CREATE POLICY "Users can view their own wallet transactions" ON public.market_wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet transactions" ON public.market_wallet_transactions
  FOR SELECT USING (public.is_user_admin());

-- =============================================================================
-- MARKET PAYOUTS TABLE - Fix Prize Money Information Exposure  
-- =============================================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "market_payouts_read_all" ON public.market_payouts;
DROP POLICY IF EXISTS "Users can view market payouts" ON public.market_payouts;

-- Create secure policy for payouts
CREATE POLICY "Users can view their own payouts" ON public.market_payouts
  FOR SELECT USING (auth.uid() = winner_id);

CREATE POLICY "Admins can view all payouts" ON public.market_payouts
  FOR SELECT USING (public.is_user_admin());

-- =============================================================================
-- MARKET MATCH RESULTS TABLE - Fix Match Performance Data Exposure
-- =============================================================================

-- Drop overly permissive policies that allow public access
DROP POLICY IF EXISTS "Users can view market results" ON public.market_match_results;
DROP POLICY IF EXISTS "market_match_results_read_all" ON public.market_match_results;

-- =============================================================================
-- TRANSACTIONS TABLE - Fix Financial Transaction Exposure
-- =============================================================================

-- Drop any overly permissive policies on transactions
DROP POLICY IF EXISTS "transactions_read_all" ON public.transactions;
DROP POLICY IF EXISTS "Users can view all transactions" ON public.transactions;

-- Create secure policy for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.is_user_admin());

-- =============================================================================
-- CREATE SAFE PUBLIC PROFILE VIEW
-- =============================================================================

-- Create a view for safe public profile access
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  created_at,
  updated_at,
  CASE WHEN xbox_gamertag IS NOT NULL THEN true ELSE false END as has_xbox_linked
FROM public.profiles;

-- Grant access to the view for public use
GRANT SELECT ON public.public_profiles TO authenticated, anon;