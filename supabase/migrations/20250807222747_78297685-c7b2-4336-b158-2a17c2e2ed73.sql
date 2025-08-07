-- Add is_test_account column to profiles table for easier identification of test data
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test_account boolean DEFAULT false;

-- Create a function to easily create test profiles for existing auth users
CREATE OR REPLACE FUNCTION setup_test_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  test_users uuid[] := ARRAY[
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000008'
  ];
  test_names text[] := ARRAY[
    'P1_Titan',
    'P2_Apex', 
    'P3_Rocket',
    'P4_War',
    'P5_Snipe',
    'P6_Dash',
    'P7_Clutch',
    'P8_Rush'
  ];
  i integer;
BEGIN
  -- Update existing profiles or insert if they exist in auth.users
  FOR i IN 1..array_length(test_users, 1) LOOP
    UPDATE profiles 
    SET 
      username = 'player' || i || '_test',
      display_name = test_names[i],
      xbox_gamertag = test_names[i],
      wallet_balance = 50.00,
      is_test_account = true,
      updated_at = now()
    WHERE user_id = test_users[i];
    
    -- Only insert if the user exists in auth.users table
    IF NOT FOUND THEN
      INSERT INTO profiles (
        user_id, 
        username, 
        display_name, 
        xbox_gamertag, 
        wallet_balance,
        is_test_account
      )
      SELECT 
        test_users[i],
        'player' || i || '_test',
        test_names[i],
        test_names[i],
        50.00,
        true
      WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = test_users[i])
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;