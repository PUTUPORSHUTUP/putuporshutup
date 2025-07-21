-- Drop the existing SECURITY DEFINER view that's causing the security warning
DROP VIEW IF EXISTS public.admin_analytics;

-- Clear the table if it exists (since we originally created it as a table)
DELETE FROM public.admin_analytics WHERE true;

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

-- Create RLS policy for the admin_analytics table to allow admin access only
CREATE POLICY "Only admins can view analytics" ON public.admin_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);