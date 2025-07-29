-- Ensure the OTP function uses secure 3-minute expiry
DROP FUNCTION IF EXISTS public.generate_otp(uuid, text, text, text, integer);

-- Create improved OTP function with fixed 3-minute expiry
CREATE OR REPLACE FUNCTION public.generate_secure_otp(
  p_user_id uuid, 
  p_purpose text, 
  p_email text DEFAULT NULL, 
  p_phone text DEFAULT NULL
)
RETURNS TABLE(otp_code text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;