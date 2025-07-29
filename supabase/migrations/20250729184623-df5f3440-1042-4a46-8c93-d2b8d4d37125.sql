-- Add only the new columns that don't exist yet
ALTER TABLE game_matrix
ADD COLUMN IF NOT EXISTS allowed_proof_types TEXT[], -- e.g. ['screenshot', 'video', 'scoreboard']
ADD COLUMN IF NOT EXISTS result_types TEXT[], -- e.g. ['1st', '2nd', '3rd', 'Lost']
ADD COLUMN IF NOT EXISTS auto_forfeit_timer_minutes INT DEFAULT 10, -- Minutes before auto-loss triggers
ADD COLUMN IF NOT EXISTS cross_platform_supported BOOLEAN DEFAULT true, -- Crossplay supported?
ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 2; -- Default match size unless overridden