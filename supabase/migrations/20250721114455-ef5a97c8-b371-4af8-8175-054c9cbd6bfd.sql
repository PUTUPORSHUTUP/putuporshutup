-- Fix infinite recursion in admin_roles policies by using security definer function

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE admin_roles.user_id = is_user_admin.user_id AND role = 'admin'
  );
END;
$$;

-- Recreate admin_roles policies using the security definer function
CREATE POLICY "Admins can manage admin roles" 
ON public.admin_roles 
FOR ALL 
USING (public.is_user_admin());

CREATE POLICY "Admins can view admin roles" 
ON public.admin_roles 
FOR SELECT 
USING (public.is_user_admin());

-- Recreate profile delete policy for admins using the security definer function
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (public.is_user_admin());