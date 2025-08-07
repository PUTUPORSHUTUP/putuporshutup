-- Create 8 test users in profiles table
INSERT INTO profiles (
  user_id, 
  username,
  display_name, 
  xbox_gamertag,
  wallet_balance
)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'player1_test', 'P1_Titan', 'P1_Titan', 50),
  ('00000000-0000-0000-0000-000000000002', 'player2_test', 'P2_Apex', 'P2_Apex', 50),
  ('00000000-0000-0000-0000-000000000003', 'player3_test', 'P3_Rocket', 'P3_Rocket', 50),
  ('00000000-0000-0000-0000-000000000004', 'player4_test', 'P4_War', 'P4_War', 50),
  ('00000000-0000-0000-0000-000000000005', 'player5_test', 'P5_Snipe', 'P5_Snipe', 50),
  ('00000000-0000-0000-0000-000000000006', 'player6_test', 'P6_Dash', 'P6_Dash', 50),
  ('00000000-0000-0000-0000-000000000007', 'player7_test', 'P7_Clutch', 'P7_Clutch', 50),
  ('00000000-0000-0000-0000-000000000008', 'player8_test', 'P8_Rush', 'P8_Rush', 50)
ON CONFLICT (user_id) DO NOTHING;