-- Fix the get_admin_analytics function to use correct table names
CREATE OR REPLACE FUNCTION public.get_admin_analytics()
 RETURNS TABLE(total_deposits numeric, total_withdrawals numeric, active_premium_users bigint, total_users bigint, total_tournaments bigint, total_challenges bigint, transactions_today bigint, tournaments_this_week bigint, new_users_this_week bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) as total_withdrawals,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_premium_users,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM tournaments) as total_tournaments,
    (SELECT COUNT(*) FROM challenges) as total_challenges,
    (SELECT COUNT(*) FROM transactions WHERE created_at > now() - interval '24 hours') as transactions_today,
    (SELECT COUNT(*) FROM tournaments WHERE created_at > now() - interval '7 days') as tournaments_this_week,
    (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '7 days') as new_users_this_week
  FROM transactions t;
$function$