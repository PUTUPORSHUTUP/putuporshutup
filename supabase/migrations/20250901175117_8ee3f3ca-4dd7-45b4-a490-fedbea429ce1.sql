-- Create highly attractive live lobbies to draw maximum users
INSERT INTO lobby_sessions (
  lobby_id,
  game_id,
  title,
  description,
  platform,
  entry_fee_cents,
  max_participants,
  status,
  session_start,
  created_by,
  created_at,
  lobby_type,
  stakes_level
) VALUES 
-- 🔥 HIGH ACTION LOBBIES
(
  'FIRE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%call of duty%' OR name ILIKE '%cod%' OR name ILIKE '%warzone%' LIMIT 1),
  '🔥 HOT DROP KINGS - LIVE NOW!',
  '💰 $25 INSTANT PAYOUT! Drop hot, get kills, WIN BIG! Elite players only - prove you''re the real deal! 🎯',
  'Xbox Series X',
  2500,
  4,
  'active',
  now() + interval '5 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'competitive',
  'high'
),
(
  'APEX' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%apex%' LIMIT 1),
  '⚡ LIGHTNING FAST WINS - JOIN NOW!',
  '🚀 $10 QUICK CASH! Fast-paced action, instant results! Perfect for skilled players who want quick wins! ⚡',
  'Xbox Series X',
  1000,
  6,
  'active', 
  now() + interval '3 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'blitz',
  'medium'
),
-- 💎 PREMIUM TIER LOBBIES
(
  'VIP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%fortnite%' LIMIT 1),
  '💎 VIP ELITE SHOWDOWN - $100 PRIZE!',
  '👑 HIGH STAKES ROYALE! $100 winner takes all! Elite tier only - where legends are made! Prove your worth! 💎',
  'Xbox Series X',
  10000,
  8,
  'filling',
  now() + interval '10 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'elite',
  'premium'
),
-- 🎯 BEGINNER FRIENDLY
(
  'NEWB' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%rocket league%' LIMIT 1),
  '🎯 ROOKIE CHAMPIONS - EASY WIN!',
  '🌟 NEW PLAYER FRIENDLY! $5 entry, big fun! Perfect for learning the ropes and getting your first W! 🏆',
  'Xbox Series X',
  500,
  4,
  'active',
  now() + interval '2 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'casual',
  'low'
),
-- 🏆 TOURNAMENT STYLE
(
  'CHAMP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%call of duty%' OR name ILIKE '%cod%' LIMIT 1),
  '🏆 CHAMPIONSHIP QUALIFIER - LIVE!',
  '🔥 QUALIFICATION ROUND! Win here and advance to our $500 championship! This is your shot at the big leagues! 🎮',
  'Xbox Series X',
  2000,
  12,
  'active',
  now() + interval '7 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'tournament',
  'high'
),
-- ⚡ SPEED ROUNDS
(
  'SPEED' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%valorant%' LIMIT 1),
  '⚡ 10-MIN SPEED ROUND - QUICK CASH!',
  '💨 FASTEST WINS IN GAMING! 10 minutes, $15 prize, instant action! Perfect for your lunch break! ⚡',
  'PC',
  1500,
  6,
  'active',
  now() + interval '1 minute',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'speed',
  'medium'
),
-- 🔥 TRENDING NOW
(
  'TREND' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games WHERE name ILIKE '%fifa%' OR name ILIKE '%fc%' LIMIT 1),
  '🔥 TRENDING: FIFA FEVER - HOT LOBBY!',
  '⚽ HOTTEST LOBBY RIGHT NOW! $20 winner takes all! Join the action everyone''s talking about! 🏆',
  'PlayStation 5',
  2000,
  8,
  'filling',
  now() + interval '6 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'trending',
  'medium'
),
-- 💪 SKILL BASED
(
  'SKILL' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM games LIMIT 1),
  '💪 SKILL SHOWCASE - PROVE YOURSELF!',
  '🎯 SKILL-BASED MATCHING! $30 prize pool! Matched with players of your level - fair fights, big rewards! 💪',
  'Xbox Series X',
  3000,
  4,
  'active',
  now() + interval '4 minutes',
  (SELECT id FROM profiles WHERE is_admin = true LIMIT 1),
  now(),
  'ranked',
  'high'
);

-- Add some lobby participants to make lobbies look active
INSERT INTO lobby_participants (
  lobby_session_id,
  user_id,
  joined_at,
  ready_status
)
SELECT 
  ls.id,
  p.user_id,
  now() - interval '30 seconds' * RANDOM(),
  CASE WHEN RANDOM() > 0.3 THEN 'ready' ELSE 'joined' END
FROM lobby_sessions ls
CROSS JOIN (
  SELECT user_id FROM profiles 
  WHERE user_id IS NOT NULL 
  ORDER BY RANDOM() 
  LIMIT 3
) p
WHERE ls.created_at > now() - interval '1 minute'
  AND RANDOM() > 0.4;  -- Don't fill every lobby