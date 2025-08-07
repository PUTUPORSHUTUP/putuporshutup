-- First ensure we have the test users setup function
-- then create the edge functions and update components

-- Update existing test profiles or do nothing if they don't exist
UPDATE profiles 
SET wallet_balance = 50.00,
    is_test_account = true,
    updated_at = now()
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000008'
);

-- Add additional helpful columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_trial_start TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;