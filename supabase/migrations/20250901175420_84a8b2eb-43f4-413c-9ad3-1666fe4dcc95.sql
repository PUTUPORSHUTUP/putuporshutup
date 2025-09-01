-- First ensure we have at least one game to reference
INSERT INTO games (name, display_name, is_active)
SELECT 'Call of Duty', 'Call of Duty: Modern Warfare', true
WHERE NOT EXISTS (SELECT 1 FROM games LIMIT 1);

-- Create highly attractive live lobbies that will draw maximum users
WITH first_game AS (
  SELECT id FROM games LIMIT 1
),
first_user AS (
  SELECT user_id FROM profiles LIMIT 1
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
SELECT 
  'FIRE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X',
  now() + interval '2 minutes',
  6,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'APEX' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X', 
  now() + interval '1 minute',
  4,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'VIP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X',
  now() + interval '5 minutes',
  8,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'filling'
UNION ALL
SELECT 
  'FAST' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X',
  now() + interval '30 seconds',
  4,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'CHAMP' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X',
  now() + interval '8 minutes',
  12,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'SPEED' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'PC',
  now() + interval '90 seconds',
  6,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'TREND' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'PlayStation 5',
  now() + interval '4 minutes',
  8,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'filling'
UNION ALL
SELECT 
  'SKILL' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X',
  now() + interval '6 minutes',
  4,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'LIVE' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game),
  'Xbox Series X',
  now() + interval '15 seconds',
  8,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active'
UNION ALL
SELECT 
  'PLAY' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'),
  (SELECT id FROM first_game), 
  'PlayStation 5',
  now() + interval '3 minutes',
  6,
  COALESCE((SELECT user_id FROM first_user), gen_random_uuid()),
  'active';

-- Add some lobby participants to make lobbies look active and create social proof
DO $$
DECLARE
  lobby_record RECORD;
  user_record RECORD;
BEGIN
  -- Add 1-3 participants to some lobbies for social proof
  FOR lobby_record IN 
    SELECT id FROM lobby_sessions 
    WHERE session_start > now() 
    ORDER BY RANDOM() 
    LIMIT 6
  LOOP
    -- Add random participants from available users
    FOR user_record IN 
      SELECT user_id FROM profiles 
      WHERE user_id IS NOT NULL 
      ORDER BY RANDOM() 
      LIMIT floor(random() * 3 + 1)::int  -- 1-3 participants per lobby
    LOOP
      INSERT INTO lobby_participants (
        lobby_session_id,
        user_id,
        joined_at,
        ready_status
      ) VALUES (
        lobby_record.id,
        user_record.user_id,
        now() - interval '30 seconds' * RANDOM(),
        CASE WHEN RANDOM() > 0.5 THEN 'ready' ELSE 'joined' END
      );
    END LOOP;
  END LOOP;
END $$;