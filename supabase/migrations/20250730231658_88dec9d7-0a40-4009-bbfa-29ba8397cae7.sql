-- Fix the final RLS policy issue for sponsor_performance table

-- Add RLS policies for sponsor_performance table
CREATE POLICY "Sponsors can view their own performance" 
ON public.sponsor_performance 
FOR SELECT 
USING (auth.uid() = sponsor_id);

CREATE POLICY "Admins can view all sponsor performance" 
ON public.sponsor_performance 
FOR SELECT 
USING (is_user_admin());

CREATE POLICY "System can manage sponsor performance" 
ON public.sponsor_performance 
FOR ALL 
USING (true);

-- Clean up any existing expired OTPs to help with OTP warning
SELECT cleanup_expired_otp();

-- Run a final security health check
SELECT * FROM security_health_check();