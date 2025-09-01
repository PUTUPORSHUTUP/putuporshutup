-- First ensure we have at least one game to reference
INSERT INTO games (name, display_name, is_active)
SELECT 'Call of Duty', 'Call of Duty: Modern Warfare', true
WHERE NOT EXISTS (SELECT 1 FROM games LIMIT 1);

-- Create highly attractive live lobbies that will draw maximum users
WITH first_game AS (
  SELECT id FROM games LIMIT 1
)
INSERT INTO lobby_sessions (
  lobby_id,
  game_id,
  platform,
  session_start,
  max_participants,
  created_by,
  status
)
SELECT * FROM (
  VALUES 
    -- 🔥 INSTANT ACTION LOBBIES
    ('FIRE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '2 minutes', 6, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    ('APEX' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '1 minute', 4, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    -- 💎 PREMIUM LOBBIES
    ('VIP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '5 minutes', 8, (SELECT user_id FROM profiles LIMIT 1), 'filling'),
    -- 🎯 QUICK START LOBBIES  
    ('FAST' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '30 seconds', 4, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    -- 🏆 CHAMPIONSHIP STYLE
    ('CHAMP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '8 minutes', 12, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    -- ⚡ SPEED ROUNDS
    ('SPEED' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'PC', now() + interval '90 seconds', 6, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    -- 🔥 TRENDING LOBBIES
    ('TREND' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'PlayStation 5', now() + interval '4 minutes', 8, (SELECT user_id FROM profiles LIMIT 1), 'filling'),
    -- 💪 SKILL SHOWCASES
    ('SKILL' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '6 minutes', 4, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    -- 🚀 INSTANT JOIN LOBBIES
    ('LIVE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'Xbox Series X', now() + interval '15 seconds', 8, (SELECT user_id FROM profiles LIMIT 1), 'active'),
    -- 🎮 VARIETY LOBBIES
    ('PLAY' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'), (SELECT id FROM first_game), 'PlayStation 5', now() + interval '3 minutes', 6, (SELECT user_id FROM profiles LIMIT 1), 'active')
) AS v(lobby_id, game_id, platform, session_start, max_participants, created_by, status);

-- Add some lobby participants to make lobbies look active and create social proof
WITH recent_lobbies AS (
  SELECT id FROM lobby_sessions WHERE created_at > now() - interval '2 minutes'
),
available_users AS (
  SELECT user_id FROM profiles WHERE user_id IS NOT NULL ORDER BY RANDOM() LIMIT 4
)
INSERT INTO lobby_participants (
  lobby_session_id,
  user_id,
  joined_at,
  ready_status
)
SELECT 
  rl.id,
  au.user_id,
  now() - interval '30 seconds' * RANDOM(),
  CASE WHEN RANDOM() > 0.6 THEN 'ready' ELSE 'joined' END
FROM recent_lobbies rl
CROSS JOIN available_users au
WHERE RANDOM() > 0.7;  -- Only populate some lobbies to create scarcity and urgency