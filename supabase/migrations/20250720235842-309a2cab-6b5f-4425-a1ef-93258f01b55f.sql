-- Fix infinite recursion in disputes RLS policies
-- Drop the problematic admin policies that reference admin_roles table
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;

-- Create new admin policies using the is_admin field from profiles table
CREATE POLICY "Admins can view all disputes" 
ON public.disputes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can update disputes" 
ON public.disputes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);