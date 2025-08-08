-- Critical fixes for payout failure issues
BEGIN;

-- Fix function security/search_path for wallet operations
ALTER FUNCTION public.increment_wallet_balance(user_id_param uuid, amount_param numeric, reason_param text, match_id_param uuid, challenge_id_param uuid)
  SECURITY DEFINER 
  SET search_path = public;

-- Fix join_challenge_atomic security
ALTER FUNCTION public.join_challenge_atomic(p_challenge_id uuid, p_user_id uuid, p_stake_amount numeric)
  SECURITY DEFINER 
  SET search_path = public;

-- Ensure wallet balance defaults and constraints
UPDATE profiles SET wallet_balance = 0 WHERE wallet_balance IS NULL;
ALTER TABLE profiles 
  ALTER COLUMN wallet_balance SET DEFAULT 0,
  ALTER COLUMN wallet_balance SET NOT NULL;

-- Add match settlement tracking to prevent double processing
ALTER TABLE matches ADD COLUMN IF NOT EXISTS settled_at timestamp with time zone;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS settlement_attempts integer DEFAULT 0;

-- Create payout monitoring view for debugging
CREATE OR REPLACE VIEW payout_guard AS
SELECT 
  m.id AS match_id,
  m.state,
  m.crashed,
  pal.status,
  pal.error_message,
  pal.processed_at,
  pal.payout_amount,
  COUNT(mq.user_id) as participant_count,
  SUM(mq.entry_fee) as total_pot
FROM matches m
LEFT JOIN payout_automation_log pal ON pal.entity_id::uuid = m.id AND pal.entity_type = 'match'
LEFT JOIN match_queue mq ON mq.match_id = m.id
WHERE m.created_at > now() - interval '24 hours'
GROUP BY m.id, m.state, m.crashed, pal.status, pal.error_message, pal.processed_at, pal.payout_amount
ORDER BY m.created_at DESC;

-- Create function to mark match as settled (idempotency)
CREATE OR REPLACE FUNCTION mark_match_settled(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_settled boolean := false;
BEGIN
  -- Check if already settled
  SELECT (settled_at IS NOT NULL) INTO already_settled
  FROM matches 
  WHERE id = p_match_id;
  
  IF already_settled THEN
    RETURN false; -- Already processed
  END IF;
  
  -- Mark as settled
  UPDATE matches 
  SET settled_at = now(),
      settlement_attempts = settlement_attempts + 1
  WHERE id = p_match_id AND settled_at IS NULL;
  
  RETURN FOUND; -- Returns true if we successfully marked it
END;
$$;

COMMIT;