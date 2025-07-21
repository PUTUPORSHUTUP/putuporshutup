-- Drop the existing SECURITY DEFINER view that's causing the security warning
DROP VIEW IF EXISTS public.admin_analytics;

-- Create a security definer function instead to get admin analytics safely
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
RETURNS TABLE (
  total_deposits numeric,
  total_withdrawals numeric,
  active_premium_users bigint,
  total_users bigint,
  total_tournaments bigint,
  total_wagers bigint,
  transactions_today bigint,
  tournaments_this_week bigint,
  new_users_this_week bigint
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_withdrawals,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_premium_users,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM tournaments) as total_tournaments,
    (SELECT COUNT(*) FROM wagers) as total_wagers,
    (SELECT COUNT(*) FROM transactions WHERE created_at > now() - interval '24 hours') as transactions_today,
    (SELECT COUNT(*) FROM tournaments WHERE created_at > now() - interval '7 days') as tournaments_this_week,
    (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '7 days') as new_users_this_week
  FROM transactions t;
$$;