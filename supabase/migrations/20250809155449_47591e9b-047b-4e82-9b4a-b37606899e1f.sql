-- First, clean up duplicates by keeping only the first occurrence of each mode_key
DELETE FROM game_modes 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM game_modes 
  GROUP BY mode_key
) AND mode_key IS NOT NULL;

-- Remove any rows with NULL mode_key that might cause issues
DELETE FROM game_modes WHERE mode_key IS NULL;

-- Now add the unique constraint
ALTER TABLE game_modes ADD CONSTRAINT unique_mode_key UNIQUE (mode_key);

-- Seed the games registry
INSERT INTO game_registry (game_key, display_name, enabled) VALUES
  ('COD6','Call of Duty 6', true),
  ('APEX','Apex Legends',   false),
  ('RL',  'Rocket League',  false),
  ('FN',  'Fortnite',       false)
ON CONFLICT (game_key) DO NOTHING;