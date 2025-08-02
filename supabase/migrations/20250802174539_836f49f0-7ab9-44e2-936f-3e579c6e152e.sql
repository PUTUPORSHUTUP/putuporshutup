-- Create automated tournament templates table
CREATE TABLE public.tournament_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  game_id UUID REFERENCES public.games(id),
  game_mode TEXT NOT NULL,
  entry_fee NUMERIC NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 16,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  prize_distribution JSONB DEFAULT '{"1st": 0.7, "2nd": 0.2, "3rd": 0.1}'::jsonb,
  weight INTEGER DEFAULT 10, -- Higher weight = more likely to be selected
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_templates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active templates
CREATE POLICY "Anyone can view active templates" ON public.tournament_templates
  FOR SELECT USING (is_active = true);

-- Allow admins to manage templates
CREATE POLICY "Admins can manage templates" ON public.tournament_templates
  FOR ALL USING (is_user_admin());

-- Create automated tournament engine status table
CREATE TABLE public.tournament_engine_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_running BOOLEAN DEFAULT true,
  last_tournament_created_at TIMESTAMPTZ,
  next_tournament_scheduled_at TIMESTAMPTZ,
  tournaments_created_today INTEGER DEFAULT 0,
  total_revenue_today NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tournament_engine_status ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view engine status
CREATE POLICY "Anyone can view engine status" ON public.tournament_engine_status
  FOR SELECT USING (true);

-- Allow admins to manage engine status
CREATE POLICY "Admins can manage engine status" ON public.tournament_engine_status
  FOR ALL USING (is_user_admin());

-- Insert default engine status
INSERT INTO public.tournament_engine_status (is_running, next_tournament_scheduled_at)
VALUES (true, now() + interval '20 minutes');

-- Insert default tournament templates for various games and modes
INSERT INTO public.tournament_templates (template_name, game_mode, entry_fee, max_participants, weight) VALUES
('Quick $5 Kill Race', 'Kill Race', 5.00, 8, 15),
('Standard $10 Battle Royale', 'Battle Royale', 10.00, 16, 20),
('Premium $20 Elimination', 'Elimination', 20.00, 12, 10),
('Fast $5 TDM', 'Team Deathmatch', 5.00, 8, 15),
('High Stakes $50 Tournament', 'Custom', 50.00, 16, 5),
('Budget $3 Quick Match', 'Quick Match', 3.00, 6, 25),
('Elite $25 Championship', 'Championship', 25.00, 16, 8),
('Blitz $7 Speed Round', 'Speed Round', 7.00, 10, 12);

-- Create function to select weighted random template
CREATE OR REPLACE FUNCTION public.get_random_tournament_template()
RETURNS public.tournament_templates
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_weight INTEGER;
  random_number INTEGER;
  current_weight INTEGER := 0;
  selected_template public.tournament_templates;
BEGIN
  -- Calculate total weight
  SELECT SUM(weight) INTO total_weight
  FROM public.tournament_templates
  WHERE is_active = true;
  
  -- Generate random number
  random_number := floor(random() * total_weight) + 1;
  
  -- Select template based on weighted random
  FOR selected_template IN
    SELECT * FROM public.tournament_templates
    WHERE is_active = true
    ORDER BY weight DESC, created_at
  LOOP
    current_weight := current_weight + selected_template.weight;
    IF current_weight >= random_number THEN
      RETURN selected_template;
    END IF;
  END LOOP;
  
  -- Fallback to first active template
  SELECT * INTO selected_template
  FROM public.tournament_templates
  WHERE is_active = true
  ORDER BY weight DESC
  LIMIT 1;
  
  RETURN selected_template;
END;
$$;