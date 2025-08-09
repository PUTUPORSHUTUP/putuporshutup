-- Now seed the game modes with proper foreign key references
INSERT INTO game_modes (mode_key, game_key, display_name, min_players, max_players, enabled) VALUES
  ('COD6:KILL_RACE','COD6','Kill Race (Solo)', 2, 2, true),
  ('COD6:TDM',      'COD6','Team Deathmatch',  4, 12, false),
  ('APEX:BR_TRIOS', 'APEX','BR Trios',         6, 60, false),
  ('RL:DUELS',      'RL',  '1v1',              2, 2,  false),
  ('RL:DUOS',       'RL',  '2v2',              4, 4,  false),
  ('FN:SOLO',       'FN',  'Solo',             2, 100, false)
ON CONFLICT (mode_key) DO NOTHING;

-- Add foreign key constraint between game_modes and game_registry
ALTER TABLE game_modes ADD CONSTRAINT fk_game_modes_registry 
  FOREIGN KEY (game_key) REFERENCES game_registry(game_key) ON DELETE CASCADE;

-- Add the helpful index
CREATE INDEX IF NOT EXISTS idx_queue_mode_stake_created
  ON match_queue (game_mode_key, stake_cents, created_at);