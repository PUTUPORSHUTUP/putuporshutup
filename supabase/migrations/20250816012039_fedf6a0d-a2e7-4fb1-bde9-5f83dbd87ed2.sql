-- Fix security vulnerability: Restrict access to profiles table
-- Remove overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

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
-- This view will respect the underlying table's RLS policies
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

-- Grant access to the public view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;