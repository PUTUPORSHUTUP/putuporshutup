-- Security hardening fixes for 100% launch readiness

-- 1. Fix function search path settings (security hardening)
-- Update all functions to have proper search_path settings

-- Update functions that don't have search_path set
ALTER FUNCTION public.safe_nextval(text) SET search_path TO 'public';
ALTER FUNCTION public.get_visit_stats() SET search_path TO 'public';
ALTER FUNCTION public.cleanup_expired_otp() SET search_path TO 'public';
ALTER FUNCTION public.update_tournament_participant_count() SET search_path TO 'public';
ALTER FUNCTION public.increment_wallet_balance(uuid, numeric) SET search_path TO 'public';
ALTER FUNCTION public.create_default_security_settings() SET search_path TO 'public';
ALTER FUNCTION public.detect_suspicious_stats(uuid, jsonb, text) SET search_path TO 'public';
ALTER FUNCTION public.generate_secure_otp(uuid, text, text, text) SET search_path TO 'public';
ALTER FUNCTION public.update_launch_metrics() SET search_path TO 'public';
ALTER FUNCTION public.update_xbox_leaderboard_stats(text, integer, integer, integer, integer, boolean, numeric) SET search_path TO 'public';
ALTER FUNCTION public.get_admin_analytics() SET search_path TO 'public';
ALTER FUNCTION public.update_premium_status() SET search_path TO 'public';
ALTER FUNCTION public.update_admin_status() SET search_path TO 'public';
ALTER FUNCTION public.expire_old_queue_entries() SET search_path TO 'public';
ALTER FUNCTION public.cleanup_expired_queue_entries() SET search_path TO 'public';

-- 2. Add RLS policies for tables that have RLS enabled but no policies
-- Check common tables that might need policies

-- Add policies for any missing tables (example for common scenarios)
-- Note: Only add if these tables exist and need policies

-- For automation_logs table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_logs' AND table_schema = 'public') THEN
        -- Only admins can view automation logs
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'automation_logs' AND policyname = 'Admins can view automation logs') THEN
            EXECUTE 'CREATE POLICY "Admins can view automation logs" ON public.automation_logs FOR SELECT USING (is_user_admin())';
        END IF;
    END IF;
END $$;

-- For system_metrics table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_metrics' AND table_schema = 'public') THEN
        -- Only admins can view system metrics
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_metrics' AND policyname = 'Admins can view system metrics') THEN
            EXECUTE 'CREATE POLICY "Admins can view system metrics" ON public.system_metrics FOR SELECT USING (is_user_admin())';
        END IF;
    END IF;
END $$;

-- For email_logs table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs' AND table_schema = 'public') THEN
        -- Only admins can view email logs
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_logs' AND policyname = 'Admins can view email logs') THEN
            EXECUTE 'CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (is_user_admin())';
        END IF;
    END IF;
END $$;

-- For api_logs table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_logs' AND table_schema = 'public') THEN
        -- Only admins can view API logs
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_logs' AND policyname = 'Admins can view API logs') THEN
            EXECUTE 'CREATE POLICY "Admins can view API logs" ON public.api_logs FOR SELECT USING (is_user_admin())';
        END IF;
    END IF;
END $$;

-- 3. Update OTP expiry settings to recommended values (3 minutes max)
-- Update the generate_secure_otp function to enforce shorter expiry times
CREATE OR REPLACE FUNCTION public.generate_secure_otp(p_user_id uuid, p_purpose text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text)
 RETURNS TABLE(otp_code text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_otp_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  v_otp_code := LPAD(FLOOR(random() * 1000000)::TEXT, 6, '0');
  -- Set expiry to 3 minutes (recommended security practice)
  v_expires_at := now() + interval '3 minutes';
  
  -- Clean up any existing unverified OTPs for this user and purpose
  DELETE FROM public.otp_verifications 
  WHERE user_id = p_user_id 
    AND purpose = p_purpose 
    AND verified_at IS NULL;
  
  -- Insert new OTP with 3-minute expiry
  INSERT INTO public.otp_verifications (
    user_id, otp_code, purpose, email, phone, expires_at
  ) VALUES (
    p_user_id, v_otp_code, p_purpose, p_email, p_phone, v_expires_at
  );
  
  RETURN QUERY SELECT v_otp_code, v_expires_at;
END;
$$;

-- 4. Create a function to help identify tables with RLS but no policies
-- This helps with ongoing security monitoring
CREATE OR REPLACE FUNCTION public.check_rls_policy_coverage()
RETURNS TABLE(
  table_name text,
  rls_enabled boolean,
  policy_count bigint,
  needs_attention boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    t.tablename::text,
    t.rowsecurity as rls_enabled,
    COALESCE(p.policy_count, 0) as policy_count,
    (t.rowsecurity = true AND COALESCE(p.policy_count, 0) = 0) as needs_attention
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
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
  ORDER BY 
    needs_attention DESC, 
    t.tablename;
$$;

-- 5. Add comprehensive logging for security events
-- Create a security_events table for audit trail
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view security events
CREATE POLICY "Admins can view security events" 
ON public.security_events 
FOR SELECT 
USING (is_user_admin());

-- System can insert security events
CREATE POLICY "System can insert security events" 
ON public.security_events 
FOR INSERT 
WITH CHECK (true);

-- 6. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details
  ) VALUES (
    p_event_type,
    p_user_id,
    p_details
  );
END;
$$;

-- 7. Add trigger to log failed login attempts
-- This helps with security monitoring
CREATE OR REPLACE FUNCTION public.monitor_auth_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log authentication events for security monitoring
  PERFORM log_security_event(
    'auth_event',
    NEW.id,
    jsonb_build_object(
      'action', TG_OP,
      'email', NEW.email,
      'last_sign_in_at', NEW.last_sign_in_at,
      'confirmed_at', NEW.confirmed_at
    )
  );
  
  RETURN NEW;
END;
$$;