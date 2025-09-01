-- Get a game_id for the tournaments
WITH game_data AS (
  SELECT id FROM games LIMIT 1
),
-- Create the 3 LIVE tournaments to prove the system works
tournament_inserts AS (
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
  ) 
  SELECT 
    gen_random_uuid(), -- creator_id (required)
    g.id,              -- game_id (required)
    title_val,
    description_val,
    entry_fee_val,
    max_participants_val,
    'Xbox Series X',   -- platform (required)
    'registration_open',
    start_time_val,
    'automated',
    true
  FROM game_data g,
  VALUES 
    (
      'LIVE Quick Strike - ' || to_char(now(), 'HH24:MI'),
      '🔥 LIVE AUTOMATED TOURNAMENT #1 - System is LIVE! Join now and prove your skills!',
      5::numeric,
      8,
      now() + interval '30 minutes'
    ),
    (
      'LIVE Elite Challenge - ' || to_char(now(), 'HH24:MI'),
      '🔥 LIVE AUTOMATED TOURNAMENT #2 - System is LIVE! Join now and prove your skills!',
      25::numeric,
      16,
      now() + interval '45 minutes'
    ),
    (
      'LIVE High Stakes - ' || to_char(now(), 'HH24:MI'),
      '🔥 LIVE AUTOMATED TOURNAMENT #3 - System is LIVE! Join now and prove your skills!',
      50::numeric,
      12,
      now() + interval '60 minutes'
    ) AS t(title_val, description_val, entry_fee_val, max_participants_val, start_time_val)
  RETURNING *
)
SELECT COUNT(*) as tournaments_created FROM tournament_inserts;