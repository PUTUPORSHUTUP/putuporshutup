-- Add tournament type and sponsorship columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS tournament_type text DEFAULT 'single_elimination',
ADD COLUMN IF NOT EXISTS custom_rules text,
ADD COLUMN IF NOT EXISTS sponsored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsorship_tier text,
ADD COLUMN IF NOT EXISTS sponsor_cost numeric DEFAULT 0;

-- Add check constraint for tournament types
ALTER TABLE tournaments 
ADD CONSTRAINT tournament_type_check 
CHECK (tournament_type IN ('single_elimination', 'double_elimination', 'round_robin', 'swiss_system', 'custom'));

-- Add check constraint for sponsorship tiers
ALTER TABLE tournaments 
ADD CONSTRAINT sponsorship_tier_check 
CHECK (sponsorship_tier IS NULL OR sponsorship_tier IN ('bronze', 'silver', 'gold', 'platinum'));

-- Update existing tournaments to have default tournament type
UPDATE tournaments 
SET tournament_type = 'single_elimination' 
WHERE tournament_type IS NULL;