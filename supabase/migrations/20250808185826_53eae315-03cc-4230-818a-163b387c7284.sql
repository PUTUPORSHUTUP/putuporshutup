-- Add the missing get_available_test_users function
CREATE OR REPLACE FUNCTION get_available_test_users(
  min_balance NUMERIC DEFAULT 5,
  max_users INTEGER DEFAULT 8
) RETURNS TABLE(user_id UUID, wallet_balance NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.wallet_balance
  FROM profiles p
  WHERE p.is_test_account = true 
    AND p.wallet_balance >= min_balance
  ORDER BY p.wallet_balance DESC, p.created_at ASC
  LIMIT max_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';