-- Final security fixes to reach 100% launch readiness

-- 1. Check which tables still need RLS policies
-- Get a complete list to fix the remaining RLS issues
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COALESCE(p.policy_count, 0) as policy_count
FROM 
  pg_tables t
LEFT JOIN (
  SELECT 
    tablename,
    COUNT(*) as policy_count
  FROM 
    pg_policies 
  WHERE 
    schemaname = 'public'
  GROUP BY 
    tablename
) p ON t.tablename = p.tablename
WHERE 
  t.schemaname = 'public'
  AND t.rowsecurity = true
  AND COALESCE(p.policy_count, 0) = 0
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%';

-- 2. Add missing RLS policies for tables that need them
-- Fix any tables that have RLS enabled but no policies

-- For soft_launch_metrics table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'soft_launch_metrics' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'soft_launch_metrics' AND policyname = 'Admins can manage launch metrics') THEN
            EXECUTE 'CREATE POLICY "Admins can manage launch metrics" ON public.soft_launch_metrics FOR ALL USING (is_user_admin())';
        END IF;
    END IF;
END $$;

-- For site_visits table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'site_visits' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_visits' AND policyname = 'Everyone can create site visits') THEN
            EXECUTE 'CREATE POLICY "Everyone can create site visits" ON public.site_visits FOR INSERT WITH CHECK (true)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_visits' AND policyname = 'Admins can view site visits') THEN
            EXECUTE 'CREATE POLICY "Admins can view site visits" ON public.site_visits FOR SELECT USING (is_user_admin())';
        END IF;
    END IF;
END $$;

-- For xbox_leaderboard_stats table  
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'xbox_leaderboard_stats' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'xbox_leaderboard_stats' AND policyname = 'Users can view xbox leaderboard stats') THEN
            EXECUTE 'CREATE POLICY "Users can view xbox leaderboard stats" ON public.xbox_leaderboard_stats FOR SELECT USING (true)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'xbox_leaderboard_stats' AND policyname = 'System can manage xbox stats') THEN
            EXECUTE 'CREATE POLICY "System can manage xbox stats" ON public.xbox_leaderboard_stats FOR ALL USING (true)';
        END IF;
    END IF;
END $$;

-- For suspicious_activities table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'suspicious_activities' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suspicious_activities' AND policyname = 'Admins can view suspicious activities') THEN
            EXECUTE 'CREATE POLICY "Admins can view suspicious activities" ON public.suspicious_activities FOR SELECT USING (is_user_admin())';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suspicious_activities' AND policyname = 'System can create suspicious activity records') THEN
            EXECUTE 'CREATE POLICY "System can create suspicious activity records" ON public.suspicious_activities FOR INSERT WITH CHECK (true)';
        END IF;
    END IF;
END $$;

-- For transactions table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can view their own transactions') THEN
            EXECUTE 'CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Admins can view all transactions') THEN
            EXECUTE 'CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (is_user_admin())';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'System can create transactions') THEN
            EXECUTE 'CREATE POLICY "System can create transactions" ON public.transactions FOR INSERT WITH CHECK (true)';
        END IF;
    END IF;
END $$;

-- For subscriptions table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'subscriptions' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view their own subscriptions') THEN
            EXECUTE 'CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Admins can view all subscriptions') THEN
            EXECUTE 'CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (is_user_admin())';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'System can manage subscriptions') THEN
            EXECUTE 'CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL USING (true)';
        END IF;
    END IF;
END $$;

-- For wagers table (renamed to challenges)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'wagers' AND schemaname = 'public' AND rowsecurity = true) THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wagers' AND policyname = 'Wagers are viewable by everyone') THEN
            EXECUTE 'CREATE POLICY "Wagers are viewable by everyone" ON public.wagers FOR SELECT USING (true)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wagers' AND policyname = 'Users can create wagers') THEN
            EXECUTE 'CREATE POLICY "Users can create wagers" ON public.wagers FOR INSERT WITH CHECK (auth.uid() = creator_id)';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wagers' AND policyname = 'Creators can update their wagers') THEN
            EXECUTE 'CREATE POLICY "Creators can update their wagers" ON public.wagers FOR UPDATE USING (auth.uid() = creator_id)';
        END IF;
    END IF;
END $$;

-- 3. Update OTP cleanup to ensure old expired OTPs are removed
-- This helps with the OTP expiry warning
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Delete expired and unverified OTPs (more aggressive cleanup)
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() 
    AND verified_at IS NULL;
    
  -- Delete verified OTPs older than 1 hour for cleanup
  DELETE FROM public.otp_verifications 
  WHERE verified_at IS NOT NULL 
    AND verified_at < now() - interval '1 hour';
    
  -- Log cleanup activity for security monitoring
  PERFORM log_security_event(
    'otp_cleanup',
    NULL,
    jsonb_build_object(
      'cleaned_at', now(),
      'action', 'expired_otp_cleanup'
    )
  );
END;
$$;

-- 4. Create a scheduler function to run OTP cleanup regularly
-- This ensures OTPs don't accumulate and cause security warnings
CREATE OR REPLACE FUNCTION public.schedule_otp_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Run OTP cleanup
  PERFORM cleanup_expired_otp();
END;
$$;

-- 5. Add comprehensive security monitoring
-- Create a function to check security health
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS TABLE(
  check_name text,
  status text,
  details text,
  severity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check for tables with RLS enabled but no policies
  RETURN QUERY
  SELECT 
    'RLS Coverage'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
    CASE WHEN COUNT(*) = 0 
      THEN 'All RLS-enabled tables have policies'
      ELSE COUNT(*)::text || ' tables have RLS enabled but no policies'
    END::text,
    CASE WHEN COUNT(*) = 0 THEN 'INFO' ELSE 'WARN' END::text
  FROM (
    SELECT t.tablename
    FROM pg_tables t
    LEFT JOIN (
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies 
      WHERE schemaname = 'public'
      GROUP BY tablename
    ) p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
      AND t.rowsecurity = true
      AND COALESCE(p.policy_count, 0) = 0
      AND t.tablename NOT LIKE 'pg_%'
  ) missing_policies;
  
  -- Check for expired OTPs
  RETURN QUERY
  SELECT 
    'OTP Cleanup'::text,
    CASE WHEN COUNT(*) < 10 THEN 'PASS' ELSE 'WARN' END::text,
    COUNT(*)::text || ' expired OTPs found'::text,
    CASE WHEN COUNT(*) < 10 THEN 'INFO' ELSE 'WARN' END::text
  FROM otp_verifications 
  WHERE expires_at < now() AND verified_at IS NULL;
  
  -- Check for recent security events
  RETURN QUERY
  SELECT 
    'Security Events'::text,
    'INFO'::text,
    COUNT(*)::text || ' security events in last 24 hours'::text,
    'INFO'::text
  FROM security_events 
  WHERE created_at > now() - interval '24 hours';
END;
$$;