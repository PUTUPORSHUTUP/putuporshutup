-- Fix security issues identified by linter

-- 1. Fix OTP expiry time - reduce default from 5 minutes to 3 minutes for better security
UPDATE public.security_settings 
SET otp_expiry_minutes = 3 
WHERE otp_expiry_minutes = 5;

-- Update the default for future records
ALTER TABLE public.security_settings 
ALTER COLUMN otp_expiry_minutes SET DEFAULT 3;

-- Update OTP generation function to use the shorter default
CREATE OR REPLACE FUNCTION public.generate_otp(
  p_user_id UUID,
  p_purpose TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_expiry_minutes INTEGER DEFAULT 3  -- Changed from 5 to 3
)
RETURNS TABLE(otp_code TEXT, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_otp_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Generate 6-digit OTP
  v_otp_code := LPAD(FLOOR(random() * 1000000)::TEXT, 6, '0');
  v_expires_at := now() + (p_expiry_minutes || ' minutes')::INTERVAL;
  
  -- Clean up any existing unverified OTPs for this user and purpose
  DELETE FROM public.otp_verifications 
  WHERE user_id = p_user_id 
    AND purpose = p_purpose 
    AND verified_at IS NULL;
  
  -- Insert new OTP
  INSERT INTO public.otp_verifications (
    user_id, otp_code, purpose, email, phone, expires_at
  ) VALUES (
    p_user_id, v_otp_code, p_purpose, p_email, p_phone, v_expires_at
  );
  
  RETURN QUERY SELECT v_otp_code, v_expires_at;
END;
$$;