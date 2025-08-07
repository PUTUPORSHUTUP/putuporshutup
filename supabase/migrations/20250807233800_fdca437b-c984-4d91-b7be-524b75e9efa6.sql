-- Add pg_cron scheduling for watchdog
SELECT cron.schedule(
  'watchdog-refund-failures',
  '*/3 * * * *', -- every 3 minutes
  $$
  SELECT net.http_post(
    url := 'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/watchdog-refund-failures',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
    body := '{"automated": true}'::jsonb
  );
  $$
);

-- Create wallet transactions table for complete audit trail
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(user_id),
  amount numeric NOT NULL,
  transaction_type text NOT NULL, -- 'debit', 'credit'
  reason text NOT NULL, -- 'join_match', 'match_payout', 'match_refund', 'deposit', 'withdrawal'
  match_id uuid,
  challenge_id uuid,
  balance_before numeric NOT NULL,
  balance_after numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- RLS for wallet transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet transactions"
ON wallet_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage wallet transactions"
ON wallet_transactions FOR ALL
USING (true);

-- Improved increment_wallet_balance with transaction logging
CREATE OR REPLACE FUNCTION increment_wallet_balance(
  user_id_param uuid,
  amount_param numeric,
  reason_param text DEFAULT 'system',
  match_id_param uuid DEFAULT NULL,
  challenge_id_param uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance numeric;
  new_balance numeric;
BEGIN
  -- Get current balance and update atomically
  SELECT wallet_balance INTO current_balance
  FROM profiles
  WHERE user_id = user_id_param
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', user_id_param;
  END IF;
  
  new_balance := COALESCE(current_balance, 0) + amount_param;
  
  -- Update balance
  UPDATE profiles
  SET wallet_balance = new_balance,
      updated_at = now()
  WHERE user_id = user_id_param;
  
  -- Log transaction
  INSERT INTO wallet_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    match_id,
    challenge_id,
    balance_before,
    balance_after
  ) VALUES (
    user_id_param,
    amount_param,
    CASE WHEN amount_param >= 0 THEN 'credit' ELSE 'debit' END,
    reason_param,
    match_id_param,
    challenge_id_param,
    COALESCE(current_balance, 0),
    new_balance
  );
END;
$$;