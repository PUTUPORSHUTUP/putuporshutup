-- Enable automation for all existing API configurations
UPDATE automation_config 
SET is_enabled = true, 
    run_frequency_minutes = 15
WHERE automation_type LIKE '%_api';

-- Add automation configs for remaining games
INSERT INTO automation_config (automation_type, is_enabled, run_frequency_minutes, config_data)
VALUES 
  ('call_of_duty_black_ops_6_api', true, 20, '{}'),
  ('call_of_duty_cold_war_api', true, 20, '{}'),
  ('fifa_21_api', true, 25, '{}'),
  ('madden_nfl_25_api', true, 20, '{}'),
  ('minecraft_api', true, 30, '{}'),
  ('mlb_the_show_25_api', true, 25, '{}'),
  ('nba_2k25_api', true, 20, '{}'),
  ('wwe_2k25_api', true, 30, '{}')
ON CONFLICT (automation_type) DO UPDATE SET
  is_enabled = true,
  run_frequency_minutes = EXCLUDED.run_frequency_minutes;

-- Enable automated score detection for all games
UPDATE game_matrix 
SET automated_score_detection = true;