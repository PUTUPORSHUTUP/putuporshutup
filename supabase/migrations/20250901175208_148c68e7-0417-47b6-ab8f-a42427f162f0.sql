-- Create highly attractive live lobbies using correct lobby_sessions structure
INSERT INTO lobby_sessions (
  lobby_id,
  game_id,
  platform,
  session_start,
  max_participants,
  created_by,
  status
) VALUES 
-- 🔥 INSTANT ACTION LOBBIES
(
  'FIRE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%call of duty%' OR name ILIKE '%cod%' OR name ILIKE '%warzone%' LIMIT 1),
  'Xbox Series X',
  now() + interval '2 minutes',
  6,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
(
  'APEX' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%apex%' LIMIT 1),
  'Xbox Series X',
  now() + interval '1 minute',
  4,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
-- 💎 PREMIUM LOBBIES
(
  'VIP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%fortnite%' LIMIT 1),
  'Xbox Series X',
  now() + interval '5 minutes',
  8,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'filling'
),
-- 🎯 QUICK START LOBBIES
(
  'FAST' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%rocket league%' LIMIT 1),
  'Xbox Series X',
  now() + interval '30 seconds',
  4,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
-- 🏆 CHAMPIONSHIP STYLE
(
  'CHAMP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%call of duty%' OR name ILIKE '%cod%' LIMIT 1),
  'Xbox Series X',
  now() + interval '8 minutes',
  12,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
-- ⚡ SPEED ROUNDS
(
  'SPEED' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%valorant%' LIMIT 1),
  'PC',
  now() + interval '90 seconds',
  6,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
-- 🔥 TRENDING LOBBIES
(
  'TREND' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%fifa%' OR name ILIKE '%fc%' LIMIT 1),
  'PlayStation 5',
  now() + interval '4 minutes',
  8,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'filling'
),
-- 💪 SKILL SHOWCASES
(
  'SKILL' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games LIMIT 1),
  'Xbox Series X',
  now() + interval '6 minutes',
  4,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
-- 🚀 INSTANT JOIN LOBBIES
(
  'LIVE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%call of duty%' OR name ILIKE '%cod%' LIMIT 1),
  'Xbox Series X',
  now() + interval '15 seconds',
  8,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
),
-- 🎮 VARIETY LOBBIES
(
  'PLAY' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%fortnite%' LIMIT 1),
  'PlayStation 5',
  now() + interval '3 minutes',
  6,
  (SELECT user_id FROM profiles WHERE is_admin = true LIMIT 1),
  'active'
);

-- Add some lobby participants to make lobbies look active and appealing
INSERT INTO lobby_participants (
  lobby_session_id,
  user_id,
  joined_at,
  ready_status
)
SELECT 
  ls.id,
  p.user_id,
  now() - interval '1 minute' * RANDOM(),
  CASE WHEN RANDOM() > 0.4 THEN 'ready' ELSE 'joined' END
FROM lobby_sessions ls
CROSS JOIN (
  SELECT user_id FROM profiles 
  WHERE user_id IS NOT NULL 
  ORDER BY RANDOM() 
  LIMIT 2
) p
WHERE ls.created_at > now() - interval '2 minutes'
  AND RANDOM() > 0.5;  -- Fill some lobbies with players to create buzz