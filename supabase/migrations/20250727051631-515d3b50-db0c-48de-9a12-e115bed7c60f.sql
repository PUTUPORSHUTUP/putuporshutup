-- Fix OTP expiry to recommended 3 minutes (currently warning says it's too long)
UPDATE security_settings 
SET otp_expiry_minutes = 3
WHERE otp_expiry_minutes > 3;

-- Set default OTP expiry to 3 minutes for future records
ALTER TABLE security_settings 
ALTER COLUMN otp_expiry_minutes SET DEFAULT 3;

-- Enable leaked password protection by updating auth configuration
-- Note: This will be handled via Supabase dashboard settings