-- Add wallet_balance column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0;