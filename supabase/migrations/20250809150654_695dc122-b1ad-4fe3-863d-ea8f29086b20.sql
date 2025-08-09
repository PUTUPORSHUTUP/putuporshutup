-- Fix remaining security issues identified by the linter

-- 1. Fix remaining tables without RLS (from linter errors)
-- Enable RLS on any remaining public tables that need it

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site visits are public readable"
ON public.site_visits
FOR SELECT
USING (true);

CREATE POLICY "Service can manage site visits"
ON public.site_visits
FOR ALL
USING (is_service_role());

-- Enable RLS on otp_verifications table
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own OTP"
ON public.otp_verifications
FOR ALL
USING (auth.uid() = user_id OR is_user_admin());

-- Enable RLS on security_events table
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view security events"
ON public.security_events
FOR SELECT
USING (is_user_admin());

CREATE POLICY "Service can log security events"
ON public.security_events
FOR INSERT
WITH CHECK (true);

-- 2. Fix remaining security definer functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_param uuid, amount_param numeric, reason_param text DEFAULT 'system'::text, match_id_param uuid DEFAULT NULL::uuid, challenge_id_param uuid DEFAULT NULL::uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
  profile_count integer;
BEGIN
  -- Check for profile existence and count
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE user_id = user_id_param;
  
  IF profile_count = 0 THEN
    RAISE EXCEPTION 'Profile not found for user %', user_id_param;
  ELSIF profile_count > 1 THEN
    RAISE EXCEPTION 'Multiple profiles found for user % (count: %)', user_id_param, profile_count;
  END IF;
  
  -- Get current balance with FOR UPDATE lock
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE user_id = user_id_param
  FOR UPDATE;
  
  new_balance := COALESCE(current_balance, 0) + amount_param;
  
  -- Prevent negative balance
  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Requested: %', current_balance, amount_param;
  END IF;
  
  -- Update balance
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Log transaction
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    match_id,
    challenge_id,
    balance_before,
    balance_after
  ) VALUES (
    user_id_param,
    amount_param,
    CASE WHEN amount_param >= 0 THEN 'credit' ELSE 'debit' END,
    reason_param,
    match_id_param,
    challenge_id_param,
    COALESCE(current_balance, 0),
    new_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.secure_update_transaction_status(p_transaction_id uuid, p_new_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow valid status transitions
  IF p_new_status NOT IN ('pending', 'completed', 'failed', 'refunded', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transaction status: %', p_new_status;
  END IF;
  
  -- Update transaction status (bypasses RLS due to SECURITY DEFINER)
  UPDATE public.transactions 
  SET 
    status = p_new_status,
    updated_at = now()
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found: %', p_transaction_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_otp(p_user_id uuid, p_otp_code text, p_purpose text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_record RECORD;
  v_is_valid BOOLEAN := FALSE;
BEGIN
  -- Get the OTP record
  SELECT * INTO v_record
  FROM public.otp_verifications
  WHERE user_id = p_user_id
    AND purpose = p_purpose
    AND verified_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_record.id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if max attempts exceeded
  IF v_record.attempts >= v_record.max_attempts THEN
    RETURN FALSE;
  END IF;
  
  -- Increment attempts
  UPDATE public.otp_verifications
  SET 
    attempts = attempts + 1,
    updated_at = now()
  WHERE id = v_record.id;
  
  -- Check if OTP matches
  IF v_record.otp_code = p_otp_code THEN
    -- Mark as verified
    UPDATE public.otp_verifications
    SET 
      verified_at = now(),
      updated_at = now()
    WHERE id = v_record.id;
    
    v_is_valid := TRUE;
  END IF;
  
  RETURN v_is_valid;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_vip_trial_v2(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_vip_trial = true,
    vip_trial_start = now(),
    trial_start = now(), -- Keep for backwards compatibility
    is_vip = true,
    vip_access = true,
    updated_at = now()
  WHERE user_id = user_id_param
    AND is_vip_trial = false  -- Only allow if not already on trial
    AND is_premium = false;   -- Only allow if not already premium
END;
$$;

CREATE OR REPLACE FUNCTION public.has_vip_access_v2(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_id_param 
    AND (
      is_premium = true OR 
      is_vip = true OR
      (is_vip_trial = true AND COALESCE(vip_trial_start, trial_start) > now() - interval '7 days')
    )
  );
END;
$$;

-- 3. Add rate limiting for security-critical operations
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