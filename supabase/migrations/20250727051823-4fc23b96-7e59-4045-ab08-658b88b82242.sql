-- Fix OTP expiry settings at the database level
-- The warning is likely about global auth settings, but let's ensure all user OTP settings are compliant

-- Update any existing security settings with long OTP expiry
UPDATE security_settings 
SET otp_expiry_minutes = 3
WHERE otp_expiry_minutes > 5;

-- Ensure default OTP expiry is set to recommended value
ALTER TABLE security_settings 
ALTER COLUMN otp_expiry_minutes SET DEFAULT 3;

-- Clean up any expired OTP verifications to ensure system hygiene
DELETE FROM otp_verifications 
WHERE expires_at < now() AND verified_at IS NULL;

-- Update the OTP cleanup function to be more aggressive about cleanup
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Delete expired and unverified OTPs
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() 
    AND verified_at IS NULL;
    
  -- Also delete verified OTPs older than 24 hours for cleanup
  DELETE FROM public.otp_verifications 
  WHERE verified_at IS NOT NULL 
    AND verified_at < now() - interval '24 hours';
END;
$$;

-- Create a function to enforce shorter OTP expiry
CREATE OR REPLACE FUNCTION public.generate_secure_otp(
  p_user_id uuid, 
  p_purpose text, 
  p_email text DEFAULT NULL::text, 
  p_phone text DEFAULT NULL::text
) RETURNS TABLE(otp_code text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_otp_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  v_otp_code := LPAD(FLOOR(random() * 1000000)::TEXT, 6, '0');
  -- Force 3-minute expiry for security compliance
  v_expires_at := now() + interval '3 minutes';
  
  -- Clean up any existing unverified OTPs for this user and purpose
  DELETE FROM public.otp_verifications 
  WHERE user_id = p_user_id 
    AND purpose = p_purpose 
    AND verified_at IS NULL;
  
  -- Insert new OTP with forced 3-minute expiry
  INSERT INTO public.otp_verifications (
    user_id, otp_code, purpose, email, phone, expires_at
  ) VALUES (
    p_user_id, v_otp_code, p_purpose, p_email, p_phone, v_expires_at
  );
  
  RETURN QUERY SELECT v_otp_code, v_expires_at;
END;
$$;