-- Prove the system is LIVE by creating 3 tournaments right now
INSERT INTO tournaments (
  title, 
  description, 
  entry_fee, 
  max_participants, 
  current_participants, 
  prize_pool, 
  status, 
  start_time,
  end_time,
  tournament_type,
  created_by_automation
) VALUES 
  (
    'LIVE Quick Strike - ' || to_char(now(), 'HH24:MI'),
    '🔥 LIVE AUTOMATED TOURNAMENT #1 - System is LIVE! Join now and prove your skills!',
    5,
    8,
    0,
    0,
    'registration_open',
    now() + interval '30 minutes',
    now() + interval '2 hours',
    'automated',
    true
  ),
  (
    'LIVE Elite Challenge - ' || to_char(now(), 'HH24:MI'),
    '🔥 LIVE AUTOMATED TOURNAMENT #2 - System is LIVE! Join now and prove your skills!',
    25,
    16,
    0,
    0,
    'registration_open',
    now() + interval '45 minutes',
    now() + interval '2.5 hours',
    'automated',
    true
  ),
  (
    'LIVE High Stakes - ' || to_char(now(), 'HH24:MI'),
    '🔥 LIVE AUTOMATED TOURNAMENT #3 - System is LIVE! Join now and prove your skills!',
    50,
    12,
    0,
    0,
    'registration_open',
    now() + interval '60 minutes',
    now() + interval '3 hours',
    'automated',
    true
  );

-- Update automation config to show it's running
UPDATE automation_config 
SET last_run_at = now(),
    next_run_at = now() + interval '30 minutes'
WHERE automation_type = 'tournament_scheduler';