-- Additional security and monitoring improvements for sim fix
BEGIN;

-- Update is_service_role function to be more robust
CREATE OR REPLACE FUNCTION is_service_role() 
RETURNS boolean 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  );
$$;

-- Add payout guard diagnostic view for monitoring
CREATE OR REPLACE VIEW payout_guard AS
SELECT 
  c.id as challenge_id,
  c.status,
  c.created_at as challenge_created,
  COUNT(cp.user_id) as participant_count,
  SUM(cp.stake_paid) as total_pot,
  pal.event_type,
  pal.status as log_status,
  pal.created_at as event_time,
  pal.error_message
FROM challenges c
LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
LEFT JOIN payout_automation_log pal ON pal.entity_id::uuid = c.id
WHERE c.created_at > now() - interval '24 hours'
  AND (pal.event_type IS NULL OR pal.event_type IN ('sim_diag', 'payout', 'payout_error', 'refund'))
GROUP BY c.id, c.status, c.created_at, pal.event_type, pal.status, pal.created_at, pal.error_message
ORDER BY c.created_at DESC, pal.created_at DESC;

-- Ensure service role has proper permissions
GRANT ALL ON payout_automation_log TO service_role;
GRANT ALL ON challenges TO service_role;  
GRANT ALL ON challenge_participants TO service_role;
GRANT ALL ON challenge_stats TO service_role;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON wallet_transactions TO service_role;

-- Add monitoring index for performance
CREATE INDEX IF NOT EXISTS idx_payout_log_entity_type_status 
ON payout_automation_log(entity_id, entity_type, event_type, status);

COMMIT;