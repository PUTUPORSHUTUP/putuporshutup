-- Fix security definer settings for wallet and queue functions
-- Note: Correcting function names and parameters based on existing functions

-- Fix increment_wallet_balance function security
ALTER FUNCTION public.increment_wallet_balance(user_id_param uuid, amount_param numeric, reason_param text, match_id_param uuid, challenge_id_param uuid) 
    SECURITY DEFINER 
    SET search_path = public;

-- Fix join_challenge_atomic function security (corrected function name)
ALTER FUNCTION public.join_challenge_atomic(p_challenge_id uuid, p_user_id uuid, p_stake_amount numeric) 
    SECURITY DEFINER 
    SET search_path = public;