-- Add the requested games to game_matrix table
INSERT INTO game_matrix (
  game, platforms, challenge_type, max_players, proof_method, 
  api_access, automated_score_detection, trend_score, 
  game_modes, result_options, allowed_proof_types,
  setup_instructions, detailed_notes, 
  host_verification_method, auto_forfeit_minutes
) VALUES 
  -- Rocket League
  (
    'Rocket League',
    'PC, PlayStation, Xbox, Nintendo Switch',
    '1v1, 2v2, 3v3, Custom',
    6,
    'API + Manual',
    true,
    true,
    95,
    '["1v1", "2v2", "3v3", "Rumble", "Dropshot", "Hoops", "Snow Day", "Tournament"]',
    '["Win", "Loss", "Goals Scored", "Saves", "Assists", "Score"]',
    '["Screenshot", "Video Clip", "API Verification"]',
    'Create a private match with the agreed settings. Share lobby name/password with opponent.',
    'Rocket League offers excellent API access through Psyonix API. Stats include goals, saves, assists, score, and match outcome. Cross-platform play supported.',
    'screenshot',
    15
  ),
  -- Apex Legends
  (
    'Apex Legends',
    'PC, PlayStation, Xbox, Nintendo Switch',
    '1v1, Squad, Custom',
    3,
    'API + Manual',
    true,
    true,
    88,
    '["Battle Royale", "Arenas", "Ranked", "Control", "Gun Run"]',
    '["Placement", "Kills", "Damage", "Assists", "Survival Time"]',
    '["Screenshot", "Video Clip", "API Verification"]',
    'Create a custom lobby or meet in ranked/unranked matchmaking. Screenshot final results.',
    'Apex Legends has limited but growing API access. Best verification through EA/Origin API for detailed match stats including placement, kills, damage dealt.',
    'screenshot',
    20
  ),
  -- NBA 2K25
  (
    'NBA 2K25',
    'PC, PlayStation, Xbox, Nintendo Switch',
    '1v1, 2v2, 3v3, 5v5',
    10,
    'Manual',
    false,
    false,
    82,
    '["MyCareer", "Park", "Pro-Am", "Rec Center", "MyTeam"]',
    '["Win", "Loss", "Points", "Assists", "Rebounds", "Final Score"]',
    '["Screenshot", "Video Clip"]',
    'Create a private match in Park, Pro-Am, or custom game mode. Screenshot final scoreboard.',
    'NBA 2K25 has limited API access. Manual verification required through screenshots of final game results and stats.',
    'screenshot',
    25
  ),
  -- MLB The Show 25
  (
    'MLB The Show 25',
    'PC, PlayStation, Xbox, Nintendo Switch',
    '1v1, Custom',
    2,
    'Manual',
    false,
    false,
    75,
    '["Diamond Dynasty", "Road to the Show", "Franchise", "Play Now"]',
    '["Win", "Loss", "Runs", "Hits", "Errors", "Final Score"]',
    '["Screenshot", "Video Clip"]',
    'Create a custom game or Diamond Dynasty match. Screenshot final box score and game summary.',
    'MLB The Show 25 relies on manual verification. Players must screenshot final game results including score, innings played, and key stats.',
    'screenshot',
    30
  )
ON CONFLICT (game) DO UPDATE SET
  platforms = EXCLUDED.platforms,
  challenge_type = EXCLUDED.challenge_type,
  max_players = EXCLUDED.max_players,
  proof_method = EXCLUDED.proof_method,
  api_access = EXCLUDED.api_access,
  automated_score_detection = EXCLUDED.automated_score_detection,
  trend_score = EXCLUDED.trend_score,
  game_modes = EXCLUDED.game_modes,
  result_options = EXCLUDED.result_options,
  allowed_proof_types = EXCLUDED.allowed_proof_types,
  setup_instructions = EXCLUDED.setup_instructions,
  detailed_notes = EXCLUDED.detailed_notes,
  host_verification_method = EXCLUDED.host_verification_method,
  auto_forfeit_minutes = EXCLUDED.auto_forfeit_minutes,
  updated_at = now();

-- Add games to the main games table
INSERT INTO games (name, display_name, description, platform, is_active) VALUES 
  (
    'rocket-league',
    'Rocket League',
    'High-octane hybrid of arcade-style soccer and vehicular mayhem',
    ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    true
  ),
  (
    'apex-legends',
    'Apex Legends',
    'Free-to-play battle royale shooter with unique character abilities',
    ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    true
  ),
  (
    'nba-2k25',
    'NBA 2K25',
    'Premier basketball simulation with realistic gameplay',
    ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    true
  ),
  (
    'mlb-the-show-25',
    'MLB The Show 25',
    'Authentic baseball simulation with Diamond Dynasty mode',
    ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    true
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  platform = EXCLUDED.platform,
  is_active = EXCLUDED.is_active;

-- Add automation configurations for these games
INSERT INTO automation_config (automation_type, config_data, is_enabled, run_frequency_minutes) VALUES
  (
    'rocket_league_api',
    '{
      "game_name": "Rocket League",
      "api_endpoints": {
        "steam": "https://api.rocketleague.com/api/v1/",
        "psn": "https://api.rocketleague.com/api/v1/",
        "xbox": "https://api.rocketleague.com/api/v1/"
      },
      "rate_limits": {
        "requests_per_minute": 100,
        "daily_limit": 10000
      },
      "stat_tracking": ["goals", "saves", "assists", "score", "mvp", "win_loss"],
      "auto_verification": true,
      "priority": "high"
    }',
    false,
    5
  ),
  (
    'apex_legends_api',
    '{
      "game_name": "Apex Legends",
      "api_endpoints": {
        "origin": "https://api.mozambiquehe.re/bridge",
        "steam": "https://api.mozambiquehe.re/bridge",
        "psn": "https://api.mozambiquehe.re/bridge",
        "xbox": "https://api.mozambiquehe.re/bridge"
      },
      "rate_limits": {
        "requests_per_minute": 60,
        "daily_limit": 5000
      },
      "stat_tracking": ["placement", "kills", "damage", "knocks", "survival_time"],
      "auto_verification": true,
      "priority": "high"
    }',
    false,
    10
  ),
  (
    'nba_2k25_monitoring',
    '{
      "game_name": "NBA 2K25",
      "verification_method": "manual",
      "required_proof": ["screenshot", "final_score"],
      "stat_tracking": ["points", "assists", "rebounds", "field_goal_percentage"],
      "auto_verification": false,
      "manual_review_required": true,
      "priority": "medium"
    }',
    true,
    30
  ),
  (
    'mlb_show_25_monitoring',
    '{
      "game_name": "MLB The Show 25",
      "verification_method": "manual",
      "required_proof": ["screenshot", "box_score"],
      "stat_tracking": ["runs", "hits", "errors", "innings"],
      "auto_verification": false,
      "manual_review_required": true,
      "priority": "medium"
    }',
    true,
    30
  )
ON CONFLICT (automation_type) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  is_enabled = EXCLUDED.is_enabled,
  run_frequency_minutes = EXCLUDED.run_frequency_minutes,
  updated_at = now();