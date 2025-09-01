-- Fix tournament automation to create 3 tournaments every 30 minutes
UPDATE automation_config 
SET config_data = jsonb_set(config_data, '{max_tournaments_per_run}', '3'),
    run_frequency_minutes = 30,
    is_enabled = true,
    next_run_at = now() + interval '1 minute'
WHERE automation_type = 'tournament_scheduler';

-- Create tournament engine status table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_engine_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_running boolean DEFAULT true,
  tournaments_created_today integer DEFAULT 0,
  last_tournament_created_at timestamptz,
  next_tournament_scheduled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert initial status record
INSERT INTO tournament_engine_status (is_running, tournaments_created_today, next_tournament_scheduled_at)
VALUES (true, 0, now() + interval '1 minute')
ON CONFLICT (id) DO UPDATE SET 
  is_running = true,
  next_tournament_scheduled_at = now() + interval '1 minute',
  updated_at = now();

-- Update the get_random_tournament_template function to work with existing schema
CREATE OR REPLACE FUNCTION get_random_tournament_template()
RETURNS tournament_templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  selected_template tournament_templates;
BEGIN
  -- Get a weighted random template from existing ones or create a default
  SELECT * INTO selected_template
  FROM tournament_templates
  WHERE is_active = true
  ORDER BY random() * COALESCE(weight, 1) DESC
  LIMIT 1;
  
  -- If no templates exist, return a default one
  IF selected_template IS NULL THEN
    INSERT INTO tournament_templates (template_name, entry_fee, max_participants, game_mode, weight)
    VALUES ('Auto Tournament', 25, 16, 'Competitive', 1)
    RETURNING * INTO selected_template;
  END IF;
  
  RETURN selected_template;
END;
$$;