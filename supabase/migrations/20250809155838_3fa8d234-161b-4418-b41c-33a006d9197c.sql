-- Make mode_name nullable since we're transitioning to the new schema
ALTER TABLE game_modes ALTER COLUMN mode_name DROP NOT NULL;

-- Now seed the game modes with proper foreign key references
INSERT INTO game_modes (mode_key, game_key, display_name, min_players, max_players, enabled, mode_name) VALUES
  ('COD6:KILL_RACE','COD6','Kill Race (Solo)', 2, 2, true, 'Kill Race (Solo)'),
  ('COD6:TDM',      'COD6','Team Deathmatch',  4, 12, false, 'Team Deathmatch'),
  ('APEX:BR_TRIOS', 'APEX','BR Trios',         6, 60, false, 'BR Trios'),
  ('RL:DUELS',      'RL',  '1v1',              2, 2,  false, '1v1'),
  ('RL:DUOS',       'RL',  '2v2',              4, 4,  false, '2v2'),
  ('FN:SOLO',       'FN',  'Solo',             2, 100, false, 'Solo')
ON CONFLICT (mode_key) DO NOTHING;

-- Add foreign key constraint between game_modes and game_registry  
ALTER TABLE game_modes ADD CONSTRAINT fk_game_modes_registry 
  FOREIGN KEY (game_key) REFERENCES game_registry(game_key) ON DELETE CASCADE;