-- Add missing created_by_automation column to tournaments table
ALTER TABLE public.tournaments 
ADD COLUMN IF NOT EXISTS created_by_automation boolean DEFAULT false;

-- Add index for better performance on automated tournaments
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by_automation 
ON public.tournaments(created_by_automation) WHERE created_by_automation = true;

-- Fix automation_config table to handle duplicates better
ALTER TABLE public.automation_config 
ADD CONSTRAINT automation_config_automation_type_unique 
UNIQUE (automation_type);