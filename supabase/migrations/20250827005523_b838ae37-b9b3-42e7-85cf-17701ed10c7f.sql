-- Fix Security Definer View issues by removing problematic views
-- These views expose sensitive data without proper access controls

-- Drop the public_profiles view that exposes sensitive user data
DROP VIEW IF EXISTS public.public_profiles;

-- Drop the v_joinable_matches view that could expose sensitive match data  
DROP VIEW IF EXISTS public.v_joinable_matches;

-- Optional: Create a more secure public profile view with limited data exposure
CREATE OR REPLACE VIEW public.public_user_profiles 
WITH (security_barrier = true)
AS 
SELECT 
    user_id,
    username,
    display_name,
    avatar_url,
    created_at,
    is_vip
FROM profiles 
WHERE user_id = auth.uid() OR display_name IS NOT NULL;

-- Enable RLS on the underlying profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a policy for the new secure view (users can only see their own data or public profiles)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT 
USING (
    auth.uid() = user_id 
    OR display_name IS NOT NULL
);