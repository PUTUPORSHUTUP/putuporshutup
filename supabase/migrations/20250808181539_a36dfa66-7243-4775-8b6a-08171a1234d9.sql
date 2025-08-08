-- Add test user management function
CREATE OR REPLACE FUNCTION manage_test_users(
  action TEXT, 
  username TEXT DEFAULT NULL,
  wallet_balance NUMERIC DEFAULT 1000
) RETURNS JSON AS $$
DECLARE
  user_id UUID;
BEGIN
  IF action = 'create' AND username IS NOT NULL THEN
    INSERT INTO profiles (user_id, username, wallet_balance, is_test_account)
    VALUES (gen_random_uuid(), username, wallet_balance, true)
    RETURNING user_id INTO user_id;
    
    RETURN json_build_object('id', user_id, 'username', username);
    
  ELSIF action = 'list' THEN
    RETURN (SELECT json_agg(json_build_object(
      'id', user_id, 
      'username', username,
      'wallet_balance', wallet_balance
    )) FROM profiles WHERE is_test_account = true);
    
  ELSIF action = 'reset' THEN
    UPDATE profiles 
    SET wallet_balance = 1000,
        updated_at = now()
    WHERE is_test_account = true;
    RETURN json_build_object('reset_count', (SELECT COUNT(*) FROM profiles WHERE is_test_account = true));
    
  ELSE
    RAISE EXCEPTION 'Invalid action: %', action;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create error tracking table
CREATE TABLE IF NOT EXISTS simulation_errors (
  id BIGSERIAL PRIMARY KEY,
  error TEXT NOT NULL,
  stack TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  env JSONB
);

CREATE INDEX IF NOT EXISTS idx_sim_errors_time ON simulation_errors (timestamp DESC);

-- Create view for test user status
CREATE OR REPLACE VIEW test_user_status AS
SELECT 
  user_id as id,
  username,
  wallet_balance,
  updated_at as last_used,
  CASE 
    WHEN wallet_balance >= 5 THEN 'available'
    ELSE 'insufficient_balance'
  END AS status
FROM profiles
WHERE is_test_account = true;

-- Ensure we have some test users
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO test_count FROM profiles WHERE is_test_account = true;
  
  IF test_count < 8 THEN
    FOR i IN 1..(8 - test_count) LOOP
      INSERT INTO profiles (user_id, username, wallet_balance, is_test_account)
      VALUES (gen_random_uuid(), 'test_user_sim_' || i || '_' || extract(epoch from now()), 1000, true)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;