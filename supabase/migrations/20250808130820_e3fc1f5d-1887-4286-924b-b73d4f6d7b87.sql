-- Fix security definer view issue
DROP VIEW payout_guard;

-- Recreate view without security definer (uses caller's permissions)
CREATE VIEW payout_guard AS
SELECT 
  c.id AS challenge_id,
  c.status,
  c.winner_id,
  c.settled_at,
  c.settlement_attempts,
  pal.status as payout_status,
  pal.error_message,
  pal.processed_at,
  pal.payout_amount,
  COUNT(cp.user_id) as participant_count,
  SUM(cp.stake_paid) as total_pot
FROM challenges c
LEFT JOIN payout_automation_log pal ON pal.entity_id::uuid = c.id AND pal.entity_type = 'challenge'  
LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
WHERE c.created_at > now() - interval '24 hours'
GROUP BY c.id, c.status, c.winner_id, c.settled_at, c.settlement_attempts, pal.status, pal.error_message, pal.processed_at, pal.payout_amount
ORDER BY c.created_at DESC;