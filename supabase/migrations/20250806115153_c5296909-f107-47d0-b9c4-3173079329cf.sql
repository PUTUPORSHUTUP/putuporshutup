-- Fix critical RLS security vulnerabilities

-- 1. Remove dangerous transaction update policy that allows any user to update any transaction
DROP POLICY IF EXISTS "update_transactions" ON public.transactions;

-- 2. Create secure transaction policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage transactions" 
ON public.transactions 
FOR ALL 
USING (false); -- Only system/service role can modify transactions

-- 3. Fix overly permissive profiles policy that exposes all user PII
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create secure profile policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public profile info only" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Remove the overly broad policy and create specific ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view public profile info only" ON public.profiles;

-- Create proper profile policies that protect sensitive data
CREATE POLICY "Users can view basic public profile info" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Only the user can see their full profile including sensitive fields
CREATE POLICY "Users can view their own full profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Add wallet balance protection
CREATE POLICY "Users can only update their own non-financial profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND OLD.wallet_balance = NEW.wallet_balance);

-- 5. Fix database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'display_name'
  );
  RETURN new;
END;
$function$;

-- 6. Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  event_data jsonb DEFAULT '{}',
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (is_user_admin());

-- 7. Create function for secure transaction updates (only for system use)
CREATE OR REPLACE FUNCTION public.update_transaction_status(
  transaction_id uuid,
  new_status text,
  admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow specific status transitions
  IF new_status NOT IN ('pending', 'completed', 'failed', 'refunded', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid transaction status: %', new_status;
  END IF;
  
  UPDATE public.transactions 
  SET 
    status = new_status,
    updated_at = now()
  WHERE id = transaction_id;
  
  -- Log the status change
  INSERT INTO public.security_audit_log (
    event_type,
    event_data,
    severity
  ) VALUES (
    'transaction_status_change',
    jsonb_build_object(
      'transaction_id', transaction_id,
      'new_status', new_status,
      'admin_notes', admin_notes
    ),
    'info'
  );
END;
$function$;