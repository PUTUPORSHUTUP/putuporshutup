-- 🚨 SOFT LAUNCH SAFETY PATCHES 🚨
-- Execute these in Supabase SQL Editor if needed during launch

-- === IMMEDIATE EMERGENCY STOP ===
-- Use this if you need to halt everything instantly
UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'emergency_mode';
UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'soft_launch';
UPDATE challenges SET status = 'cancelled' WHERE status IN ('open', 'in_progress');

-- === LAUNCH PHASE ROLLBACKS ===

-- 1. Roll back to Phase 0 (pre-launch)
UPDATE app_settings SET value = '0'::jsonb WHERE key = 'launch_phase';
UPDATE app_settings SET value = '50'::jsonb WHERE key = 'max_users';
UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'invite_only';
UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'soft_launch';

-- 2. Roll back to Phase 1 (5% traffic)
UPDATE app_settings SET value = '1'::jsonb WHERE key = 'launch_phase';
UPDATE app_settings SET value = '50'::jsonb WHERE key = 'max_users';
UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'invite_only';

-- 3. Roll back to Phase 2 (20% traffic)
UPDATE app_settings SET value = '2'::jsonb WHERE key = 'launch_phase';
UPDATE app_settings SET value = '200'::jsonb WHERE key = 'max_users';
UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'invite_only';

-- === EMERGENCY REFUND PATCHES ===

-- Cancel all active matches and refund participants
WITH cancelled_matches AS (
  UPDATE challenges 
  SET status = 'cancelled', updated_at = now() 
  WHERE status IN ('open', 'in_progress')
  RETURNING id, total_pot
),
participant_refunds AS (
  UPDATE profiles 
  SET wallet_balance = wallet_balance + (
    SELECT COALESCE(SUM(cp.stake_paid), 0)
    FROM challenge_participants cp
    JOIN challenges c ON cp.challenge_id = c.id
    WHERE c.status = 'cancelled' 
    AND c.updated_at > now() - interval '10 minutes'
    AND cp.user_id = profiles.user_id
  )
  WHERE user_id IN (
    SELECT cp.user_id
    FROM challenge_participants cp
    JOIN challenges c ON cp.challenge_id = c.id
    WHERE c.status = 'cancelled' 
    AND c.updated_at > now() - interval '10 minutes'
  )
  RETURNING user_id
)
SELECT 
  (SELECT COUNT(*) FROM cancelled_matches) as cancelled_matches,
  (SELECT COUNT(*) FROM participant_refunds) as refunded_users;

-- === TRAFFIC THROTTLING PATCHES ===

-- Reduce to minimal traffic (emergency throttle)
UPDATE app_settings SET value = '25'::jsonb WHERE key = 'max_users';
UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'invite_only';

-- Moderate throttle
UPDATE app_settings SET value = '100'::jsonb WHERE key = 'max_users';

-- Remove throttle (full capacity)
UPDATE app_settings SET value = '1000'::jsonb WHERE key = 'max_users';
UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'invite_only';

-- === PLAYER SHORTAGE EMERGENCY PATCH ===
-- Creates 20 emergency test users with $2000 balance each
SELECT deploy_emergency_users(20);

-- === MANUAL PAYOUT RECOVERY ===
-- If payouts fail, manually credit winners (replace MATCH_ID and WINNER_ID)
UPDATE profiles 
SET wallet_balance = wallet_balance + (
  SELECT total_pot * 0.9 FROM challenges WHERE id = 'MATCH_ID'
)
WHERE user_id = 'WINNER_ID';

-- Mark challenge as completed
UPDATE challenges 
SET status = 'completed', winner_id = 'WINNER_ID', updated_at = now()
WHERE id = 'MATCH_ID';

-- === HEALTH CHECK QUERIES ===

-- Check current launch status
SELECT 
  key,
  value,
  description
FROM app_settings 
WHERE key IN ('soft_launch', 'max_users', 'launch_phase', 'invite_only', 'emergency_mode');

-- Check active users (last hour)
SELECT COUNT(*) as active_users_1h
FROM profiles 
WHERE last_used > now() - interval '1 hour';

-- Check market health
SELECT 
  COUNT(*) FILTER (WHERE status = 'open') as open_challenges,
  COUNT(*) FILTER (WHERE status = 'in_progress') as active_challenges,
  COUNT(*) FILTER (WHERE status = 'completed' AND updated_at > now() - interval '1 hour') as completed_1h
FROM challenges;

-- Check recent errors
SELECT 
  event_type,
  error_message,
  created_at,
  details
FROM market_events 
WHERE error_message IS NOT NULL 
AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- === PERFORMANCE MONITORING ===

-- Check database performance
SELECT 
  AVG(EXTRACT(EPOCH FROM (now() - created_at))) as avg_response_time_seconds
FROM market_events 
WHERE created_at > now() - interval '1 hour';

-- Check payout success rate
SELECT 
  COUNT(*) FILTER (WHERE error_message IS NULL) * 100.0 / COUNT(*) as success_rate_percent
FROM market_events 
WHERE created_at > now() - interval '1 hour';

-- === COMPLETE SYSTEM RESET ===
-- ⚠️ NUCLEAR OPTION - Only use if everything is broken
UPDATE app_settings SET value = 'false'::jsonb WHERE key = 'soft_launch';
UPDATE app_settings SET value = 'true'::jsonb WHERE key = 'emergency_mode';
UPDATE app_settings SET value = '0'::jsonb WHERE key = 'launch_phase';
UPDATE challenges SET status = 'cancelled' WHERE status IN ('open', 'in_progress');

-- === CURL COMMANDS FOR EDGE FUNCTIONS ===

/*
EMERGENCY ROLLBACK:
curl -X POST 'https://mwuakdaogbywysjplrmx.functions.supabase.co/emergency-rollback' \
  -H 'Content-Type: application/json' \
  -d '{"reason":"soft_launch_issue"}'

LAUNCH CONTROL:
curl -X POST 'https://mwuakdaogbywysjplrmx.functions.supabase.co/launch-control' \
  -H 'Content-Type: application/json' \
  -d '{"action":"emergency_stop"}'

EMERGENCY USERS:
curl -X POST 'https://mwuakdaogbywysjplrmx.functions.supabase.co/emergency-users' \
  -H 'Content-Type: application/json' \
  -d '{"user_count":10}'
*/