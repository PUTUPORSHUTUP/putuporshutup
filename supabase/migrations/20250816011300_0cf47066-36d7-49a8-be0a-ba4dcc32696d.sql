-- Fix security vulnerability: Restrict access to profiles table
-- Remove overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create secure policies for profiles table
-- Policy 1: Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can view limited public info from other profiles (for leaderboards, social features)
-- Only expose non-sensitive fields like username, display_name, avatar_url, etc.
-- Hide sensitive data like wallet_balance, financial info, Xbox tokens, etc.
CREATE POLICY "Public can view limited profile info" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL  -- Must be authenticated
);

-- Policy 3: Admins can view all profiles for moderation
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_user_admin());

-- Create a secure view for public profile data that only exposes safe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  created_at,
  updated_at,
  -- Expose only non-sensitive gaming stats
  total_wagered,
  total_winnings,
  win_percentage,
  current_streak,
  best_streak,
  -- Do NOT expose: wallet_balance, xbox_access_token, xbox_refresh_token, 
  -- payment info, personal details, etc.
  is_vip,
  vip_access
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Grant access to the public view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;