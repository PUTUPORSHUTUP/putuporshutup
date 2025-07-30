-- Add API integrations for trending games missing automation
-- Based on trending games service data and current gaps

-- First, add the trending games to our games table if they don't exist
INSERT INTO games (name, display_name, description, platform, is_active) VALUES 
  (
    'fortnite',
    'Fortnite',
    'Battle royale with building mechanics - trending #2 with 400M+ players',
    ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    true
  ),
  (
    'valorant',
    'Valorant',
    'Tactical first-person shooter - trending #3 with 23M+ players',
    ARRAY['PC'],
    true
  ),
  (
    'call_of_duty_warzone',
    'Call of Duty: Warzone',
    'Battle royale shooter - trending #4 with 85M+ players',
    ARRAY['PC', 'PlayStation', 'Xbox'],
    true
  ),
  (
    'counter_strike_2',
    'Counter-Strike 2',
    'Tactical first-person shooter - trending #6 with 32M+ players',
    ARRAY['PC'],
    true
  ),
  (
    'fifa_24',
    'EA Sports FC 24',
    'Football simulation - trending #7 with 45M+ players',
    ARRAY['PC', 'PlayStation', 'Xbox'],
    true
  ),
  (
    'overwatch_2',
    'Overwatch 2',
    'Team-based first-person shooter - trending #8 with 35M+ players',
    ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'],
    true
  ),
  (
    'league_of_legends',
    'League of Legends',
    'Multiplayer online battle arena - trending #9 with 180M+ players',
    ARRAY['PC'],
    true
  ),
  (
    'dota_2',
    'Dota 2',
    'Multiplayer online battle arena - trending #10 with 11M+ players',
    ARRAY['PC'],
    true
  ),
  (
    'pubg',
    'PUBG: Battlegrounds',
    'Battle royale shooter - trending #11 with 227M+ players',
    ARRAY['PC', 'PlayStation', 'Xbox'],
    true
  ),
  (
    'rainbow_six_siege',
    'Rainbow Six Siege',
    'Tactical first-person shooter - trending #12 with 55M+ players',
    ARRAY['PC', 'PlayStation', 'Xbox'],
    true
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  platform = EXCLUDED.platform,
  is_active = EXCLUDED.is_active;

-- Add automation configurations for trending games missing API automation
INSERT INTO automation_config (automation_type, config_data, is_enabled, run_frequency_minutes) VALUES
  (
    'fortnite_api',
    '{
      "game_name": "Fortnite",
      "api_endpoints": {
        "epic_games": "https://fortnite-api.com/v2/stats/br/v2",
        "fortnite_tracker": "https://api.fortnitetracker.com/v1/profile"
      },
      "rate_limits": {
        "requests_per_minute": 120,
        "daily_limit": 15000
      },
      "stat_tracking": ["placement", "kills", "eliminations", "wins", "matches_played", "k_d_ratio"],
      "auto_verification": true,
      "priority": "high",
      "trend_score": 92
    }',
    false,
    3
  ),
  (
    'valorant_api',
    '{
      "game_name": "Valorant",
      "api_endpoints": {
        "riot_games": "https://valorant-api.com/v1/",
        "riot_official": "https://americas.api.riotgames.com/val/"
      },
      "rate_limits": {
        "requests_per_minute": 100,
        "daily_limit": 20000
      },
      "stat_tracking": ["round_score", "kills", "deaths", "assists", "combat_score", "damage_dealt"],
      "auto_verification": true,
      "priority": "high",
      "trend_score": 88
    }',
    false,
    5
  ),
  (
    'warzone_api',
    '{
      "game_name": "Call of Duty: Warzone",
      "api_endpoints": {
        "activision": "https://api.callofduty.com/",
        "cod_tracker": "https://api.tracker.gg/api/v2/warzone/"
      },
      "rate_limits": {
        "requests_per_minute": 60,
        "daily_limit": 8000
      },
      "stat_tracking": ["placement", "kills", "damage", "contracts_completed", "cash_earned"],
      "auto_verification": true,
      "priority": "high",
      "trend_score": 85
    }',
    false,
    8
  ),
  (
    'counter_strike_2_api',
    '{
      "game_name": "Counter-Strike 2",
      "api_endpoints": {
        "steam": "https://api.steampowered.com/ISteamUserStats/",
        "faceit": "https://open.faceit.com/data/v4/"
      },
      "rate_limits": {
        "requests_per_minute": 200,
        "daily_limit": 25000
      },
      "stat_tracking": ["rounds_won", "kills", "deaths", "assists", "mvp_count", "headshot_percentage"],
      "auto_verification": true,
      "priority": "high",
      "trend_score": 80
    }',
    false,
    5
  ),
  (
    'fifa_24_api',
    '{
      "game_name": "EA Sports FC 24",
      "api_endpoints": {
        "ea_sports": "https://fifa-api.ea.com/",
        "futdb": "https://futdb.app/api/"
      },
      "rate_limits": {
        "requests_per_minute": 80,
        "daily_limit": 10000
      },
      "stat_tracking": ["goals", "assists", "pass_accuracy", "shots_on_target", "possession"],
      "auto_verification": true,
      "priority": "medium",
      "trend_score": 78
    }',
    false,
    10
  ),
  (
    'overwatch_2_api',
    '{
      "game_name": "Overwatch 2",
      "api_endpoints": {
        "blizzard": "https://us.api.blizzard.com/data/ow/",
        "overwatch_api": "https://overwatch-api.tekrop.fr/"
      },
      "rate_limits": {
        "requests_per_minute": 100,
        "daily_limit": 12000
      },
      "stat_tracking": ["eliminations", "deaths", "damage_dealt", "healing_done", "objective_time"],
      "auto_verification": true,
      "priority": "medium",
      "trend_score": 75
    }',
    false,
    8
  ),
  (
    'league_of_legends_api',
    '{
      "game_name": "League of Legends",
      "api_endpoints": {
        "riot_games": "https://americas.api.riotgames.com/lol/",
        "data_dragon": "https://ddragon.leagueoflegends.com/"
      },
      "rate_limits": {
        "requests_per_minute": 120,
        "daily_limit": 30000
      },
      "stat_tracking": ["kills", "deaths", "assists", "cs_score", "gold_earned", "damage_dealt"],
      "auto_verification": true,
      "priority": "high",
      "trend_score": 73
    }',
    false,
    6
  ),
  (
    'dota_2_api',
    '{
      "game_name": "Dota 2",
      "api_endpoints": {
        "steam": "https://api.steampowered.com/IDOTA2Match_570/",
        "opendota": "https://api.opendota.com/api/"
      },
      "rate_limits": {
        "requests_per_minute": 60,
        "daily_limit": 50000
      },
      "stat_tracking": ["kills", "deaths", "assists", "last_hits", "gpm", "xpm", "hero_damage"],
      "auto_verification": true,
      "priority": "medium",
      "trend_score": 70
    }',
    false,
    10
  )
ON CONFLICT (automation_type) DO UPDATE SET
  config_data = EXCLUDED.config_data,
  is_enabled = EXCLUDED.is_enabled,
  run_frequency_minutes = EXCLUDED.run_frequency_minutes,
  updated_at = now();

-- Update game_matrix for trending games with API capabilities
INSERT INTO game_matrix (
  game, platforms, challenge_type, max_players, proof_method, 
  api_access, automated_score_detection, trend_score, 
  game_modes, result_options, allowed_proof_types,
  setup_instructions, detailed_notes, 
  host_verification_method, auto_forfeit_minutes
) VALUES 
  (
    'Fortnite',
    'PC, PlayStation, Xbox, Nintendo Switch',
    'Solo, Duo, Squad, Custom',
    100,
    'API + Manual',
    true,
    true,
    92,
    '["Battle Royale", "Zero Build", "Creative", "Team Rumble"]',
    '["Victory Royale", "Placement", "Eliminations", "Assists", "Damage"]',
    '["Screenshot", "Video Clip", "API Verification"]',
    'Join same lobby or create custom match. Epic Games/Fortnite Tracker API integration for automated verification.',
    'Fortnite offers robust API access through Epic Games API and Fortnite Tracker. Automated verification available for eliminations, placement, and match stats.',
    'screenshot',
    15
  ),
  (
    'Valorant',
    'PC',
    '1v1, 5v5, Custom',
    10,
    'API + Manual',
    true,
    true,
    88,
    '["Competitive", "Unrated", "Spike Rush", "Deathmatch", "Custom"]',
    '["Match Won", "Round Score", "Combat Score", "Kills", "Deaths", "Assists"]',
    '["Screenshot", "Video Clip", "API Verification"]',
    'Create custom match or meet in competitive/unrated. Riot Games API provides detailed match statistics.',
    'Valorant has excellent API support through Riot Games API. Full automated verification for combat scores, K/D, assists, and round outcomes.',
    'screenshot',
    12
  ),
  (
    'Call of Duty: Warzone',
    'PC, PlayStation, Xbox',
    'Solo, Duo, Trio, Quad',
    4,
    'API + Manual',
    true,
    true,
    85,
    '["Battle Royale", "Plunder", "Resurgence", "Private"]',
    '["Victory", "Placement", "Kills", "Damage", "Contracts", "Cash"]',
    '["Screenshot", "Video Clip", "API Verification"]',
    'Drop in same lobby or create private match. COD Tracker API integration for match verification.',
    'Warzone supports API verification through COD Tracker and Activision APIs. Automated stats for placement, eliminations, and damage.',
    'screenshot',
    20
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