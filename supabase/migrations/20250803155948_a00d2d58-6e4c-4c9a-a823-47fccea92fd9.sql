-- Fix match_preferences table to include all required columns
ALTER TABLE match_preferences 
ADD COLUMN IF NOT EXISTS preferred_challenge_types text[] DEFAULT ARRAY[]::text[];

-- Also add any other missing columns that might be needed
ALTER TABLE match_preferences 
ADD COLUMN IF NOT EXISTS auto_match_enabled boolean DEFAULT false;

ALTER TABLE match_preferences 
ADD COLUMN IF NOT EXISTS max_queue_time_minutes integer DEFAULT 30;