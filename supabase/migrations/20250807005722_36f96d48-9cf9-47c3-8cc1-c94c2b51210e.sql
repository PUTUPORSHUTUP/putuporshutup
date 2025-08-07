-- Add VIP trial columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS vip_expires TIMESTAMP;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;