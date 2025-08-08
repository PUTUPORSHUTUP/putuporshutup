-- Add test user management function (without auto-creation)
CREATE OR REPLACE FUNCTION manage_test_users(
  action TEXT, 
  username TEXT DEFAULT NULL,
  wallet_balance NUMERIC DEFAULT 1000
) RETURNS JSON AS $$
BEGIN
  IF action = 'list' THEN
    RETURN (SELECT json_agg(json_build_object(
      'id', user_id, 
      'username', username,
      'wallet_balance', wallet_balance,
      'is_test_account', is_test_account
    )) FROM profiles WHERE is_test_account = true);
    
  ELSIF action = 'reset' THEN
    UPDATE profiles 
    SET wallet_balance = 1000,
        updated_at = now()
    WHERE is_test_account = true;
    RETURN json_build_object('reset_count', (SELECT COUNT(*) FROM profiles WHERE is_test_account = true));
    
  ELSIF action = 'count' THEN
    RETURN json_build_object('test_user_count', (SELECT COUNT(*) FROM profiles WHERE is_test_account = true));
    
  ELSE
    RAISE EXCEPTION 'Invalid action: %. Valid actions: list, reset, count', action;
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
WHERE is_test_account = true
ORDER BY wallet_balance DESC, updated_at ASC;