-- Fix remaining security issues identified by the linter (avoiding duplicates)

-- 1. Enable RLS on remaining tables that need it (checking if they don't already have RLS)
DO $$
BEGIN
  -- Enable RLS on site_visits if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'site_visits' 
    AND n.nspname = 'public' 
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on otp_verifications if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'otp_verifications' 
    AND n.nspname = 'public' 
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Create policies only if they don't exist
DO $$
BEGIN
  -- Site visits policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_visits' 
    AND policyname = 'Site visits are public readable'
  ) THEN
    CREATE POLICY "Site visits are public readable"
    ON public.site_visits
    FOR SELECT
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_visits' 
    AND policyname = 'Service can manage site visits'
  ) THEN
    CREATE POLICY "Service can manage site visits"
    ON public.site_visits
    FOR ALL
    USING (is_service_role());
  END IF;

  -- OTP verifications policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'otp_verifications' 
    AND policyname = 'Users can manage their own OTP'
  ) THEN
    CREATE POLICY "Users can manage their own OTP"
    ON public.otp_verifications
    FOR ALL
    USING (auth.uid() = user_id OR is_user_admin());
  END IF;

  -- Security events policies (only create if not exists)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'security_events' 
    AND policyname = 'Service can log security events'
  ) THEN
    CREATE POLICY "Service can log security events"
    ON public.security_events
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- 3. Add rate limiting function for security-critical operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action_type text,
  p_max_attempts integer DEFAULT 5,
  p_time_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Count recent attempts
  SELECT COUNT(*) INTO attempt_count
  FROM security_events
  WHERE user_id = p_user_id
    AND event_type = p_action_type
    AND created_at > now() - (p_time_window_minutes || ' minutes')::interval;
  
  IF attempt_count >= p_max_attempts THEN
    -- Log the rate limit violation
    PERFORM log_security_violation(
      'rate_limit_exceeded',
      p_user_id,
      jsonb_build_object(
        'action_type', p_action_type,
        'attempt_count', attempt_count,
        'max_attempts', p_max_attempts
      )
    );
    RETURN FALSE;
  END IF;
  
  -- Log the attempt
  PERFORM log_security_event(
    p_action_type,
    p_user_id,
    jsonb_build_object('timestamp', now())
  );
  
  RETURN TRUE;
END;
$$;

-- 4. Create wallet balance validation trigger for additional security
CREATE OR REPLACE FUNCTION public.validate_wallet_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent negative balances
  IF NEW.wallet_balance < 0 THEN
    RAISE EXCEPTION 'Wallet balance cannot be negative: %', NEW.wallet_balance;
  END IF;
  
  -- Log large balance changes
  IF OLD.wallet_balance IS NOT NULL AND 
     ABS(NEW.wallet_balance - OLD.wallet_balance) > 1000 THEN
    PERFORM log_security_event(
      'large_balance_change',
      NEW.user_id,
      jsonb_build_object(
        'old_balance', OLD.wallet_balance,
        'new_balance', NEW.wallet_balance,
        'difference', NEW.wallet_balance - OLD.wallet_balance
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for wallet balance validation
DROP TRIGGER IF EXISTS validate_wallet_balance_trigger ON public.profiles;
CREATE TRIGGER validate_wallet_balance_trigger
  BEFORE UPDATE OF wallet_balance ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_wallet_balance();