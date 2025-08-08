-- Fix Search Path security issues for existing functions
-- Add SET search_path to existing functions that are missing it

-- Fix update_tournament_participant_count function
CREATE OR REPLACE FUNCTION public.update_tournament_participant_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments 
    SET current_participants = current_participants + 1,
        updated_at = now()
    WHERE id = NEW.tournament_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments 
    SET current_participants = GREATEST(current_participants - 1, 0),
        updated_at = now()
    WHERE id = OLD.tournament_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix monitor_auth_events function
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

-- Fix create_default_security_settings function  
CREATE OR REPLACE FUNCTION public.create_default_security_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Fix update_admin_status function
CREATE OR REPLACE FUNCTION public.update_admin_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET is_admin = true, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if user has any remaining admin roles
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = OLD.user_id AND role = 'admin'
    ) THEN
      UPDATE public.profiles 
      SET is_admin = false, updated_at = now()
      WHERE user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Reduce OTP expiry time to recommended 3 minutes
-- Update the generate_secure_otp function to use shorter expiry
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