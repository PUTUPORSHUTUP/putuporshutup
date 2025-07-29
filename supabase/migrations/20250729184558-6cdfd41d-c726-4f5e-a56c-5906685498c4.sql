ALTER TABLE game_matrix
ADD COLUMN setup_instructions TEXT, -- Steps to create a private/custom match
ADD COLUMN allowed_proof_types TEXT[], -- e.g. ['screenshot', 'video', 'scoreboard']
ADD COLUMN result_types TEXT[], -- e.g. ['1st', '2nd', '3rd', 'Lost']
ADD COLUMN auto_forfeit_timer_minutes INT DEFAULT 10, -- Minutes before auto-loss triggers
ADD COLUMN cross_platform_supported BOOLEAN DEFAULT true, -- Crossplay supported?
ADD COLUMN max_players INT DEFAULT 2; -- Default match size unless overridden