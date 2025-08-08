-- EMERGENCY: Reset all test user balances to $50
UPDATE profiles 
SET wallet_balance = 50.00, 
    updated_at = now()
WHERE is_test_account = true;

-- Verify we have enough test users
INSERT INTO profiles (user_id, username, wallet_balance, is_test_account, display_name)
SELECT 
  gen_random_uuid(),
  'test_sim_' || generate_series || '_emergency',
  50.00,
  true,
  'Emergency Test Player ' || generate_series
FROM generate_series(1, 8)
WHERE (SELECT COUNT(*) FROM profiles WHERE is_test_account = true) < 8
ON CONFLICT DO NOTHING;