-- Create function to increment wallet balance safely
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  user_id_param uuid,
  amount_param numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE profiles 
  SET wallet_balance = wallet_balance + amount_param,
      updated_at = now()
  WHERE user_id = user_id_param;
END;
$$;