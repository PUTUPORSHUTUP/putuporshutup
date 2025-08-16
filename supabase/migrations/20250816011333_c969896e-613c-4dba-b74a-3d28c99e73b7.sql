-- Fix security vulnerability: Restrict access to profiles table
-- Remove overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create secure policies for profiles table
-- Policy 1: Users can view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Admins can view all profiles for moderation
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
  bio,
  xbox_gamertag,  -- Public gamertag is safe
  total_wins,
  total_losses,
  total_wagered,  -- Gaming stats are safe for leaderboards
  created_at,
  is_vip,
  vip_access
  -- EXCLUDED SENSITIVE DATA: wallet_balance, payoneer_email, xbox_xuid, 
  -- xbox_profile_picture, last_ip, is_admin, is_test flags, premium info
FROM public.profiles;

-- Enable RLS on the view (security barrier)
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Grant access to the public view for authenticated users only
GRANT SELECT ON public.public_profiles TO authenticated;

-- Policy for public view access - authenticated users can view public profile data
CREATE POLICY "Authenticated users can view public profiles" 
ON public.public_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);