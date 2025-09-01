-- Update tournament scheduler to create 3 tournaments every 30 minutes (3 tournaments every 90 minutes)
UPDATE automation_config 
SET config_data = jsonb_set(config_data, '{max_tournaments_per_run}', '3'),
    run_frequency_minutes = 30,
    is_enabled = true,
    next_run_at = now() + interval '2 minutes'
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
VALUES (true, 0, now() + interval '2 minutes')
ON CONFLICT (id) DO UPDATE SET 
  is_running = true,
  next_tournament_scheduled_at = now() + interval '2 minutes',
  updated_at = now();

-- Create tournament templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournament_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  entry_fee numeric NOT NULL,
  max_participants integer DEFAULT 16,
  duration_minutes integer DEFAULT 120,
  game_mode text DEFAULT 'Multiplayer',
  prize_distribution jsonb DEFAULT '{"1st": 60, "2nd": 30, "3rd": 10}',
  weight integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Insert tournament templates
INSERT INTO tournament_templates (template_name, entry_fee, max_participants, duration_minutes, game_mode, weight)
VALUES 
  ('Quick Strike', 5, 8, 60, 'Kill Race', 3),
  ('Elite Challenge', 25, 16, 90, 'Competitive', 2),
  ('Pro Circuit', 50, 32, 120, 'Tournament', 1),
  ('Weekend Warrior', 10, 12, 75, 'Objective', 3),
  ('High Stakes', 100, 8, 45, 'Elimination', 1)
ON CONFLICT DO NOTHING;

-- Create function to get random tournament template
CREATE OR REPLACE FUNCTION get_random_tournament_template()
RETURNS tournament_templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  selected_template tournament_templates;
BEGIN
  -- Get a weighted random template
  SELECT * INTO selected_template
  FROM tournament_templates
  WHERE is_active = true
  ORDER BY random() * weight DESC
  LIMIT 1;
  
  RETURN selected_template;
END;
$$;