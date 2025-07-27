-- Remove existing platform constraint and add new one with all platforms
ALTER TABLE game_api_integrations DROP CONSTRAINT IF EXISTS game_api_integrations_platform_check;

-- Add updated platform constraint to include all gaming platforms
ALTER TABLE game_api_integrations 
ADD CONSTRAINT game_api_integrations_platform_check 
CHECK (platform IN ('PlayStation', 'PS5', 'Xbox', 'Nintendo Switch', 'PC', 'Mobile'));

-- Now add the API integrations for Xbox, Nintendo Switch, and PC
INSERT INTO game_api_integrations (game_id, platform, api_endpoint, is_active, rate_limit_per_minute, stat_mappings) 
VALUES 
  ((SELECT id FROM games WHERE name = 'call-of-duty-cold-war' LIMIT 1), 'Xbox', 'https://api.xbox.com/v2/player/stats', true, 30, '{"kills": "eliminations", "deaths": "deaths", "assists": "assists", "score": "score"}'),
  ((SELECT id FROM games WHERE name = 'fifa-21' LIMIT 1), 'Xbox', 'https://api.xbox.com/v2/fifa/stats', true, 30, '{"goals": "goals_scored", "assists": "assists", "wins": "matches_won", "losses": "matches_lost"}'),
  ((SELECT id FROM games WHERE name = 'call-of-duty-cold-war' LIMIT 1), 'Nintendo Switch', 'https://api.nintendo.com/v1/player/stats', true, 20, '{"kills": "eliminations", "deaths": "deaths", "assists": "assists", "score": "score"}'),
  ((SELECT id FROM games WHERE name = 'call-of-duty-cold-war' LIMIT 1), 'PC', 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/', true, 60, '{"kills": "total_kills", "deaths": "total_deaths", "assists": "total_assists", "score": "total_score"}'),
  ((SELECT id FROM games WHERE name = 'fifa-21' LIMIT 1), 'PC', 'https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/', true, 60, '{"goals": "goals_scored", "assists": "assists", "wins": "matches_won", "losses": "matches_lost"}');