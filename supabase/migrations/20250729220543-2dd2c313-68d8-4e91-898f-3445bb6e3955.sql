-- Insert tournament templates with collectible cover art
INSERT INTO public.tournament_templates (
  template_name,
  game_id,
  schedule_cron,
  max_participants,
  entry_fee,
  prize_distribution,
  tournament_settings,
  is_active,
  cover_art_url,
  poster_title_template,
  collectible_series,
  title_variations
) VALUES 
(
  'Elite Showdown',
  'a39ff069-f19e-4d56-b522-81601ad60cee',
  '0 */2 * * *',
  16,
  25.00,
  '{"first": 70, "second": 20, "third": 10}'::jsonb,
  '{"format": "single_elimination", "rules": "Best of 3"}'::jsonb,
  true,
  '/src/assets/tournament-poster-elite-001.jpg',
  '{series} #{episode}: {variation}',
  'Elite Championship Series',
  '["Legends Rise", "Elite Clash", "Champions Arena", "Victory Pursuit", "Ultimate Showdown"]'::jsonb
),
(
  'Masters Cup',
  '2b277553-0c32-4e8e-8bbf-718e98afeb5b',
  '0 */3 * * *',
  8,
  50.00,
  '{"first": 60, "second": 25, "third": 15}'::jsonb,
  '{"format": "double_elimination", "rules": "Best of 5"}'::jsonb,
  true,
  '/src/assets/tournament-poster-masters-001.jpg',
  '{series} #{episode}: {variation}',
  'Masters Championship Series',
  '["Masters Elite", "Grand Masters", "Championship Glory", "Victory Crown", "Ultimate Masters"]'::jsonb
),
(
  'Pro League',
  '38d1ac58-1a3a-41d1-8263-09252bf5bf22',
  '0 */1 * * *',
  32,
  10.00,
  '{"first": 50, "second": 30, "third": 20}'::jsonb,
  '{"format": "swiss", "rules": "Best of 1"}'::jsonb,
  true,
  '/src/assets/tournament-poster-pro-001.jpg',
  '{series} #{episode}: {variation}',
  'Pro League Championship Series',
  '["Pro Challenge", "League Masters", "Championship Pro", "Elite Pro", "Victory League"]'::jsonb
) ON CONFLICT DO NOTHING;