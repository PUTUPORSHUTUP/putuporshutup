-- Add DELETE policies for profiles table
-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can delete any profile
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.admin_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));