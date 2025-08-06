-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create automated payout schedule
-- This will run every 5 minutes to process completed challenges/tournaments
SELECT cron.schedule(
  'automated-wallet-payouts',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
        url:='https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/automated-wallet-payouts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);

-- Create trigger to automatically pay out completed challenges
CREATE OR REPLACE FUNCTION auto_payout_challenge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger if challenge is marked as completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
    -- Call automated payout processor
    PERFORM
      net.http_post(
        url := 'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/automated-payout-processor',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body := json_build_object(
          'challengeId', NEW.id,
          'winnerId', NEW.winner_id,
          'verificationMethod', 'automated',
          'amount', NEW.total_pot
        )::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for challenges
CREATE TRIGGER trigger_auto_payout_challenge
  AFTER UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION auto_payout_challenge();

-- Create trigger to automatically pay out completed tournaments
CREATE OR REPLACE FUNCTION auto_payout_tournament()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only trigger if tournament is marked as completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND OLD.winner_id IS NULL THEN
    -- Call automated tournament payout
    PERFORM
      net.http_post(
        url := 'https://mwuakdaogbywysjplrmx.supabase.co/functions/v1/auto-tournament-payout',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13dWFrZGFvZ2J5d3lzanBscm14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc1MjMsImV4cCI6MjA2ODYxMzUyM30.Ocg97rg7G0Zkuf12DW5udFRwmpK1rL2EKthgvdVStpQ"}'::jsonb,
        body := json_build_object(
          'tournamentId', NEW.id
        )::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for tournaments
CREATE TRIGGER trigger_auto_payout_tournament
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION auto_payout_tournament();

-- Add automation tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payout_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  payout_amount NUMERIC,
  winner_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on automation log
ALTER TABLE public.payout_automation_log ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view automation logs
CREATE POLICY "Admins can view payout automation logs" 
ON public.payout_automation_log 
FOR SELECT 
USING (is_user_admin());