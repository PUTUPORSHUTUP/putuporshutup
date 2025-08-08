-- Ensure the is_admin column exists on profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Update your profile to admin status using email lookup
-- Replace 'your-email@example.com' with your actual login email
UPDATE profiles 
SET is_admin = true, updated_at = now()
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'  -- <-- Replace with your actual email
);