-- Add VIP trial columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_trial_start TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;