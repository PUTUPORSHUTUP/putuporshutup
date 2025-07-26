-- Add test moderator role for debugging
-- First, let's insert some test data to see if there are any users
-- This is safe to run multiple times due to the ON CONFLICT clause

-- Add a moderator role for testing (replace with actual user ID when testing)
-- Note: You'll need to replace 'your-user-id-here' with your actual auth.uid()
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES (
  -- Get the first user from profiles table for testing
  (SELECT user_id FROM public.profiles LIMIT 1),
  'mod',
  NULL
) ON CONFLICT (user_id, role) DO NOTHING;

-- Add some test flagged matches for debugging
INSERT INTO public.flagged_matches (flagged_by, flag_reason, priority, status, mod_notes)
VALUES 
  (
    (SELECT user_id FROM public.profiles LIMIT 1),
    'Suspicious activity reported',
    'high',
    'pending',
    'Initial review required'
  ),
  (
    (SELECT user_id FROM public.profiles LIMIT 1),
    'Result dispute',
    'medium', 
    'under_review',
    'Checking proof of game result'
  )
ON CONFLICT DO NOTHING;