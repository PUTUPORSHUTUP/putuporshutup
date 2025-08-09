-- First, let's see what's in the current game_modes table and modify it
-- Add the new columns we need
ALTER TABLE public.game_modes ADD COLUMN IF NOT EXISTS mode_key text;
ALTER TABLE public.game_modes ADD COLUMN IF NOT EXISTS game_key text;
ALTER TABLE public.game_modes ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.game_modes ADD COLUMN IF NOT EXISTS min_players int DEFAULT 2;
ALTER TABLE public.game_modes ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT false;

-- Update existing data to use new structure (if any exists)
UPDATE public.game_modes 
SET 
  mode_key = COALESCE(mode_key, 'LEGACY:' || mode_name),
  display_name = COALESCE(display_name, mode_name),
  enabled = COALESCE(enabled, is_active)
WHERE mode_key IS NULL OR display_name IS NULL;