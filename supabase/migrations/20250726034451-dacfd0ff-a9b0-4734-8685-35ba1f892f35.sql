-- Create OTP verification table for enhanced security
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', '2fa', 'password_reset', 'login')),
  email TEXT,
  phone TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for OTP verifications
CREATE POLICY "Users can view their own OTP verifications" 
ON public.otp_verifications 
FOR SELECT 
USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can insert their own OTP verifications" 
ON public.otp_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own OTP verifications" 
ON public.otp_verifications 
FOR UPDATE 
USING (auth.uid() = user_id OR email = auth.jwt() ->> 'email');

-- Create security settings table
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  otp_method TEXT CHECK (otp_method IN ('email', 'sms', 'app')) DEFAULT 'email',
  otp_expiry_minutes INTEGER NOT NULL DEFAULT 5,
  max_login_attempts INTEGER NOT NULL DEFAULT 3,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
  password_change_required BOOLEAN NOT NULL DEFAULT false,
  last_password_change TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_login TIMESTAMP WITH TIME ZONE,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security settings
CREATE POLICY "Users can view their own security settings" 
ON public.security_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings" 
ON public.security_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" 
ON public.security_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_otp_verifications_user_id ON public.otp_verifications(user_id);
CREATE INDEX idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX idx_otp_verifications_purpose ON public.otp_verifications(purpose);

CREATE INDEX idx_security_settings_user_id ON public.security_settings(user_id);

-- Create trigger for automatic timestamp updates on security_settings
CREATE TRIGGER update_security_settings_updated_at
BEFORE UPDATE ON public.security_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on otp_verifications
CREATE TRIGGER update_otp_verifications_updated_at
BEFORE UPDATE ON public.otp_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() 
    AND verified_at IS NULL;
END;
$$;

-- Function to generate and store OTP
CREATE OR REPLACE FUNCTION public.generate_otp(
  p_user_id UUID,
  p_purpose TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_expiry_minutes INTEGER DEFAULT 5
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

-- Function to verify OTP
CREATE OR REPLACE FUNCTION public.verify_otp(
  p_user_id UUID,
  p_otp_code TEXT,
  p_purpose TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

-- Function to create default security settings for new users
CREATE OR REPLACE FUNCTION public.create_default_security_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create security settings for new users
CREATE TRIGGER on_auth_user_created_security_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.create_default_security_settings();