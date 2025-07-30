-- Fix the sponsor_performance table policies with correct column reference

-- First, let's see what columns the sponsor_performance table actually has
DO $$ 
DECLARE
    col_exists boolean;
BEGIN
    -- Check if user_id column exists (common pattern)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sponsor_performance' 
        AND table_schema = 'public' 
        AND column_name = 'user_id'
    ) INTO col_exists;
    
    IF col_exists THEN
        -- Use user_id column
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsor_performance' AND policyname = 'Users can view their own sponsor performance') THEN
            EXECUTE 'CREATE POLICY "Users can view their own sponsor performance" ON public.sponsor_performance FOR SELECT USING (auth.uid() = user_id)';
        END IF;
    END IF;
    
    -- Add admin policy regardless
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsor_performance' AND policyname = 'Admins can view all sponsor performance') THEN
        EXECUTE 'CREATE POLICY "Admins can view all sponsor performance" ON public.sponsor_performance FOR SELECT USING (is_user_admin())';
    END IF;
    
    -- Add system policy for managing data
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsor_performance' AND policyname = 'System can manage sponsor performance') THEN
        EXECUTE 'CREATE POLICY "System can manage sponsor performance" ON public.sponsor_performance FOR ALL USING (true)';
    END IF;
END $$;

-- Clean up expired OTPs to help with security warnings
SELECT cleanup_expired_otp();

-- Run final security health check
SELECT * FROM security_health_check();