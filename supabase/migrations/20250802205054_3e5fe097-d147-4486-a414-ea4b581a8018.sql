-- Enable automation for all existing API configurations
UPDATE automation_config 
SET is_enabled = true, 
    run_frequency_minutes = 15,
    config_data = jsonb_build_object(
      'description', 'Automated API integration for ' || REPLACE(automation_type, '_api', ''),
      'max_requests_per_hour', 240,
      'priority', 'high'
    )
WHERE automation_type IN (
  'apex_legends_api', 'counter_strike_2_api', 'fortnite_api', 
  'league_of_legends_api', 'overwatch_2_api', 'rocket_league_api', 
  'valorant_api', 'warzone_api'
);

-- Add automation configs for games that don't have API integrations yet
INSERT INTO automation_config (automation_type, is_enabled, run_frequency_minutes, config_data)
VALUES 
  ('call_of_duty_black_ops_6_api', true, 20, '{"description": "COD Black Ops 6 manual verification automation", "verification_method": "manual"}'),
  ('call_of_duty_cold_war_api', true, 20, '{"description": "COD Cold War automation", "verification_method": "api"}'),
  ('fifa_21_api', true, 25, '{"description": "FIFA 21 score tracking automation", "verification_method": "screenshot"}'),
  ('madden_nfl_25_api', true, 20, '{"description": "Madden NFL 25 stats automation", "verification_method": "manual"}'),
  ('minecraft_api', true, 30, '{"description": "Minecraft challenge automation", "verification_method": "manual"}'),
  ('mlb_the_show_25_api', true, 25, '{"description": "MLB The Show 25 stats automation", "verification_method": "manual"}'),
  ('nba_2k25_api', true, 20, '{"description": "NBA 2K25 stats automation", "verification_method": "manual"}'),
  ('wwe_2k25_api', true, 30, '{"description": "WWE 2K25 match automation", "verification_method": "manual"})
ON CONFLICT (automation_type) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  run_frequency_minutes = EXCLUDED.run_frequency_minutes,
  config_data = EXCLUDED.config_data;

-- Update game matrix to enable automated score detection for more games
UPDATE game_matrix 
SET automated_score_detection = true,
    updated_at = now()
WHERE game IN (
  'Call of Duty: Cold War', 'Counter-Strike 2', 'FIFA 21', 
  'League of Legends', 'Minecraft', 'MLB The Show 25', 
  'NBA 2K25', 'Overwatch 2', 'WWE 2K25'
);

-- Create trending games orchestrator entries for all games
INSERT INTO automation_config (automation_type, is_enabled, run_frequency_minutes, config_data)
SELECT 
  LOWER(REPLACE(REPLACE(game, ' ', '_'), ':', '')) || '_trending',
  true,
  CASE 
    WHEN api_access = true THEN 10
    ELSE 20
  END,
  jsonb_build_object(
    'description', 'Trending analysis for ' || game,
    'game_slug', LOWER(REPLACE(REPLACE(game, ' ', '_'), ':', '')),
    'priority', CASE WHEN api_access = true THEN 'high' ELSE 'medium' END
  )
FROM game_matrix
WHERE game NOT IN (
  SELECT REPLACE(REPLACE(automation_type, '_trending', ''), '_', ' ')
  FROM automation_config 
  WHERE automation_type LIKE '%_trending'
)
ON CONFLICT (automation_type) DO NOTHING;