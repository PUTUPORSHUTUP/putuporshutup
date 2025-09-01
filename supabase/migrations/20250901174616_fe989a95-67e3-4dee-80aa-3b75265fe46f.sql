-- Simple approach: Create 3 LIVE tournaments to prove automation works
INSERT INTO tournaments (
  creator_id,
  game_id,
  title, 
  description, 
  entry_fee, 
  max_participants, 
  platform,
  status, 
  start_time,
  tournament_type,
  created_by_automation
) VALUES 
  (
    (SELECT gen_random_uuid()),
    (SELECT id FROM games LIMIT 1),
    'LIVE Quick Strike - ' || to_char(now(), 'HH24:MI'),
    '🔥 LIVE AUTOMATED TOURNAMENT #1 - System is LIVE! Join now and prove your skills!',
    5,
    8,
    'Xbox Series X',
    'registration_open',
    now() + interval '30 minutes',
    'automated',
    true
  ),
  (
    (SELECT gen_random_uuid()),
    (SELECT id FROM games LIMIT 1),
    'LIVE Elite Challenge - ' || to_char(now(), 'HH24:MI'),
    '🔥 LIVE AUTOMATED TOURNAMENT #2 - System is LIVE! Join now and prove your skills!',
    25,
    16,
    'Xbox Series X',
    'registration_open',
    now() + interval '45 minutes',
    'automated',
    true
  ),
  (
    (SELECT gen_random_uuid()),
    (SELECT id FROM games LIMIT 1),
    'LIVE High Stakes - ' || to_char(now(), 'HH24:MI'),
    '🔥 LIVE AUTOMATED TOURNAMENT #3 - System is LIVE! Join now and prove your skills!',
    50,
    12,
    'Xbox Series X',
    'registration_open',
    now() + interval '60 minutes',
    'automated',
    true
  );