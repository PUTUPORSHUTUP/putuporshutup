-- Update the get_admin_analytics function to accept hide_test_data parameter
DROP FUNCTION IF EXISTS get_admin_analytics();

CREATE OR REPLACE FUNCTION get_admin_analytics(hide_test_data BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  total_deposits DECIMAL,
  total_withdrawals DECIMAL,
  active_premium_users BIGINT,
  total_users BIGINT,
  total_tournaments BIGINT,
  total_challenges BIGINT,
  transactions_today BIGINT,
  tournaments_this_week BIGINT,
  new_users_this_week BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(deposits.total, 0) as total_deposits,
    COALESCE(withdrawals.total, 0) as total_withdrawals,
    COALESCE(premium_users.count, 0) as active_premium_users,
    COALESCE(all_users.count, 0) as total_users,
    COALESCE(all_tournaments.count, 0) as total_tournaments,
    COALESCE(all_challenges.count, 0) as total_challenges,
    COALESCE(today_transactions.count, 0) as transactions_today,
    COALESCE(week_tournaments.count, 0) as tournaments_this_week,
    COALESCE(week_users.count, 0) as new_users_this_week
  FROM 
    (SELECT 1) as dummy_table
  LEFT JOIN (
    SELECT SUM(amount) as total
    FROM transactions 
    WHERE type = 'deposit' 
    AND status = 'completed'
    AND (NOT hide_test_data OR user_id NOT IN (
      SELECT user_id FROM profiles 
      WHERE username ILIKE '%test%' OR display_name ILIKE '%test%'
    ))
  ) deposits ON true
  LEFT JOIN (
    SELECT SUM(amount) as total
    FROM transactions 
    WHERE type = 'withdrawal' 
    AND status = 'completed'
    AND (NOT hide_test_data OR user_id NOT IN (
      SELECT user_id FROM profiles 
      WHERE username ILIKE '%test%' OR display_name ILIKE '%test%'
    ))
  ) withdrawals ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM profiles 
    WHERE is_premium = true
    AND (NOT hide_test_data OR (username NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%'))
  ) premium_users ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM profiles
    WHERE (NOT hide_test_data OR (username NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%'))
  ) all_users ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM tournaments
    WHERE (NOT hide_test_data OR title NOT ILIKE '%test%')
  ) all_tournaments ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM wagers
    WHERE (NOT hide_test_data OR title NOT ILIKE '%test%')
  ) all_challenges ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM transactions 
    WHERE DATE(created_at) = CURRENT_DATE
    AND (NOT hide_test_data OR user_id NOT IN (
      SELECT user_id FROM profiles 
      WHERE username ILIKE '%test%' OR display_name ILIKE '%test%'
    ))
  ) today_transactions ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM tournaments 
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND (NOT hide_test_data OR title NOT ILIKE '%test%')
  ) week_tournaments ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM profiles 
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND (NOT hide_test_data OR (username NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%'))
  ) week_users ON true;
END;
$$;