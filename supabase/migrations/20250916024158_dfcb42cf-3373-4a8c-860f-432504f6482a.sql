-- Fix critical security vulnerabilities - targeted approach

-- First, let's check and fix the profiles table RLS
-- The main issue is that ALL profile data is currently publicly accessible
-- We need to create a function that returns only safe public fields

-- Create a security definer function to get only public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  created_at timestamptz,
  updated_at timestamptz,
  has_xbox_linked boolean
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.created_at,
    p.updated_at,
    CASE WHEN p.xbox_gamertag IS NOT NULL THEN true ELSE false END as has_xbox_linked
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;

-- Drop the overly permissive "Profiles are viewable by everyone" policy if it exists
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new restrictive policy for public access that only allows basic info
CREATE POLICY "Limited public profile access" ON public.profiles
  FOR SELECT 
  USING (
    -- Users can see their own complete profile
    auth.uid() = user_id
    OR
    -- Or admins can see everything
    public.is_user_admin()
  );

-- Create a view for safe public profile access (this will be the main way to get public profile data)
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

-- Enable RLS on the view to be extra safe
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Fix market tables only if policies don't exist
DO $$
BEGIN
  -- Check if market wallet policies need to be created
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_wallets' AND policyname = 'Users can view their own wallet') THEN
    EXECUTE 'CREATE POLICY "Users can view their own wallet" ON public.market_wallets FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'market_wallet_transactions' AND policyname = 'Users can view their own transactions') THEN
    EXECUTE 'CREATE POLICY "Users can view their own transactions" ON public.market_wallet_transactions FOR SELECT USING (auth.uid() = user_id)';
  END IF;

  -- Remove any overly permissive policies on sensitive tables
  EXECUTE 'DROP POLICY IF EXISTS "market_wallets_read_all" ON public.market_wallets';
  EXECUTE 'DROP POLICY IF EXISTS "market_wallet_transactions_read_all" ON public.market_wallet_transactions';
  EXECUTE 'DROP POLICY IF EXISTS "market_payouts_read_all" ON public.market_payouts';
  EXECUTE 'DROP POLICY IF EXISTS "market_match_results_read_all" ON public.market_match_results';
END
$$;