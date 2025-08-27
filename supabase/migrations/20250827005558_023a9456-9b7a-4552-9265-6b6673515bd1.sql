-- Fix the remaining Security Definer View issue
-- Remove the security_barrier view which is still triggering the security warning

-- Drop the view with security barrier that's still causing issues
DROP VIEW IF EXISTS public.public_user_profiles;

-- Instead, rely on the properly secured profiles table with RLS policies
-- Users can access profile data directly through the profiles table with RLS policies