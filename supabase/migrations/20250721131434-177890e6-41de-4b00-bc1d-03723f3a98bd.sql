-- Create admin profile for existing auth user
-- First, get the user ID for putuporshutup67@gmail.com and create their profile
INSERT INTO public.profiles (user_id, username, display_name, is_admin)
SELECT id, 'admin', 'Admin User', true
FROM auth.users 
WHERE email = 'putuporshutup67@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  username = 'admin',
  display_name = 'Admin User',
  is_admin = true,
  updated_at = now();

-- Grant admin role
INSERT INTO public.admin_roles (user_id, role, granted_by)
SELECT id, 'admin', id
FROM auth.users 
WHERE email = 'putuporshutup67@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;