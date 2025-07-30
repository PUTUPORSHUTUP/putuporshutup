-- Create three additional High Noon Showdown tournaments with lower entry fees
INSERT INTO tournaments (
  id,
  title,
  description,
  game_id,
  platform,
  entry_fee,
  max_participants,
  start_time,
  registration_closes_at,
  tournament_type,
  creator_id,
  prize_pool,
  poster_title,
  cover_art_url,
  collectible_series,
  season_number,
  episode_number,
  custom_rules,
  proof_required,
  verification_threshold,
  auto_verification
) VALUES
-- $5 Entry Fee Tournament
(
  gen_random_uuid(),
  'High Noon Rookie Showdown - COD Western Challenge',
  'Perfect for newcomers! When the clock strikes noon, even rookies can prove their worth. COD meets the Wild West in this beginner-friendly cowboy showdown.',
  '2b277553-0c32-4e8e-8bbf-718e98afeb5b', -- COD BO6
  'Xbox',
  5.00,
  32,
  '2025-07-31 12:00:00+00',
  '2025-07-31 11:45:00+00',
  'single_elimination',
  'b51e56dd-7b61-4fe9-bba0-6ffb2b51b8d0',
  160.00, -- 32 * 5 = 160
  'High Noon Rookie Showdown: COD Western Challenge',
  '/assets/sunday-showdown-12noon.jpg',
  'Wild West Gaming Series',
  1,
  2,
  'Rookie tier tournament - perfect for new players',
  true,
  0.85,
  true
),
-- $10 Entry Fee Tournament  
(
  gen_random_uuid(),
  'High Noon Gunslinger Showdown - COD Western Challenge',
  'For the seasoned gunslingers! When the clock strikes noon, show your skills. COD meets the Wild West in this mid-tier cowboy showdown.',
  '2b277553-0c32-4e8e-8bbf-718e98afeb5b', -- COD BO6
  'Xbox',
  10.00,
  32,
  '2025-07-31 12:00:00+00',
  '2025-07-31 11:45:00+00',
  'single_elimination',
  'b51e56dd-7b61-4fe9-bba0-6ffb2b51b8d0',
  320.00, -- 32 * 10 = 320
  'High Noon Gunslinger Showdown: COD Western Challenge',
  '/assets/sunday-showdown-12noon.jpg',
  'Wild West Gaming Series',
  1,
  3,
  'Gunslinger tier tournament - for experienced players',
  true,
  0.85,
  true
),
-- $25 Entry Fee Tournament
(
  gen_random_uuid(),
  'High Noon Marshal Showdown - COD Western Challenge',
  'The marshal''s challenge awaits! When the clock strikes noon, only the best survive. COD meets the Wild West in this high-stakes cowboy showdown.',
  '2b277553-0c32-4e8e-8bbf-718e98afeb5b', -- COD BO6
  'Xbox',
  25.00,
  32,
  '2025-07-31 12:00:00+00',
  '2025-07-31 11:45:00+00',
  'single_elimination',
  'b51e56dd-7b61-4fe9-bba0-6ffb2b51b8d0',
  800.00, -- 32 * 25 = 800
  'High Noon Marshal Showdown: COD Western Challenge',
  '/assets/sunday-showdown-12noon.jpg',
  'Wild West Gaming Series',
  1,
  4,
  'Marshal tier tournament - for skilled competitors',
  true,
  0.85,
  true
);