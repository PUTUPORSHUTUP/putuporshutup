-- Clean up duplicates using ROW_NUMBER() window function
WITH duplicate_modes AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY mode_key ORDER BY created_at) as rn
  FROM game_modes 
  WHERE mode_key IS NOT NULL
)
DELETE FROM game_modes 
WHERE id IN (
  SELECT id FROM duplicate_modes WHERE rn > 1
);

-- Remove any rows with NULL mode_key 
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