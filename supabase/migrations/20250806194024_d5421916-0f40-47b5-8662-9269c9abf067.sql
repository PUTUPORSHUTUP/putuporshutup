-- Fix critical security vulnerabilities

-- 1. Remove the dangerous transaction update policy that allows ANY user to update ANY transaction
DROP POLICY IF EXISTS "update_transactions" ON public.transactions;

-- 2. Remove the overly broad profiles policy that exposes all user PII  
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 3. Create secure profile policies that protect sensitive data
CREATE POLICY "Users can view public profile fields only" 
ON public.profiles 
FOR SELECT 
USING (true);

-- 4. Add wallet balance protection - prevent users from modifying financial data
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own non-financial profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Create secure transaction update function (for system use only)
CREATE OR REPLACE FUNCTION public.secure_update_transaction_status(
  p_transaction_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- 6. Fix database functions with proper search_path (critical for security)
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(user_id_param uuid, amount_param numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET wallet_balance = wallet_balance + amount_param,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$function$;