-- Update existing users to be test accounts with sufficient funds for simulation
UPDATE profiles 
SET 
  wallet_balance = 100.00,
  is_test_account = true,
  updated_at = now()
WHERE user_id IN (
  SELECT user_id 
  FROM profiles 
  WHERE wallet_balance < 100 
  ORDER BY created_at ASC 
  LIMIT 8
);

-- Ensure we have at least 8 test accounts with funds
INSERT INTO profiles (user_id, username, display_name, wallet_balance, is_test_account)
SELECT 
  gen_random_uuid(),
  'sim_test_' || generate_series,
  'Sim Test Player ' || generate_series,
  100.00,
  true
FROM generate_series(1, 8)
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE is_test_account = true AND wallet_balance >= 5 
  HAVING COUNT(*) >= 8
)
ON CONFLICT DO NOTHING;