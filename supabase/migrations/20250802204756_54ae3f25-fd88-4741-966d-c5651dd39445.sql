-- Enable automation for all games with API access
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
  ('fifa_21_api', true, 25, '{"description": "FIFA 21 score tracking automation", "verification_method": "screenshot"}'),
  ('madden_nfl_25_api', true, 20, '{"description": "Madden NFL 25 stats automation", "verification_method": "manual"}'),
  ('minecraft_api', true, 30, '{"description": "Minecraft challenge automation", "verification_method": "manual"}'),
  ('mlb_the_show_25_api', true, 25, '{"description": "MLB The Show 25 stats automation", "verification_method": "manual"}'),
  ('nba_2k25_api', true, 20, '{"description": "NBA 2K25 stats automation", "verification_method": "manual"}'),
  ('wwe_2k25_api', true, 30, '{"description": "WWE 2K25 match automation", "verification_method": "manual"}')
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

-- Insert API integrations for games that have API access
INSERT INTO game_api_integrations (game_id, platform, api_endpoint, is_active, stat_mappings)
SELECT 
  gm.id,
  'PC',
  CASE gm.game
    WHEN 'Counter-Strike 2' THEN 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/'
    WHEN 'FIFA 21' THEN 'https://api.ea.com/fifa/stats'
    WHEN 'League of Legends' THEN 'https://americas.api.riotgames.com/lol/summoner/v4/'
    WHEN 'Overwatch 2' THEN 'https://overfast-api.tekrop.fr/v1/players/'
    ELSE 'https://api.placeholder.com/v1/stats'
  END,
  true,
  jsonb_build_object(
    'kills', 'kills',
    'deaths', 'deaths',
    'assists', 'assists',
    'score', 'score',
    'wins', 'wins',
    'losses', 'losses'
  )
FROM game_matrix gm
WHERE gm.api_access = true 
  AND gm.game NOT IN ('Apex Legends', 'Call of Duty: Warzone', 'Fortnite', 'Rocket League', 'Valorant')
ON CONFLICT DO NOTHING;