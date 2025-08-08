-- Create test accounts with sufficient funds for simulation
INSERT INTO profiles (user_id, username, display_name, wallet_balance, is_test_account, is_premium, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'test_player_1', 'Test Player 1', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_2', 'Test Player 2', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_3', 'Test Player 3', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_4', 'Test Player 4', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_5', 'Test Player 5', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_6', 'Test Player 6', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_7', 'Test Player 7', 100.00, true, false, now(), now()),
  (gen_random_uuid(), 'test_player_8', 'Test Player 8', 100.00, true, false, now(), now())
ON CONFLICT (user_id) DO NOTHING;