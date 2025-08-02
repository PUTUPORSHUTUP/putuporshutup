-- Create tables for passive income automation system
CREATE TABLE public.revenue_automation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_type TEXT NOT NULL,
  target_revenue_per_hour NUMERIC DEFAULT 50.00,
  current_revenue_rate NUMERIC DEFAULT 0,
  optimization_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.automated_tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id),
  automation_schedule JSONB NOT NULL,
  revenue_target NUMERIC DEFAULT 500.00,
  participant_target INTEGER DEFAULT 32,
  auto_created BOOLEAN DEFAULT true,
  xbox_server_assigned BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_execution TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.passive_income_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  hourly_revenue NUMERIC DEFAULT 0,
  tournaments_created INTEGER DEFAULT 0,
  matches_facilitated INTEGER DEFAULT 0,
  xbox_uptime_hours NUMERIC DEFAULT 0,
  automation_efficiency_score NUMERIC DEFAULT 0,
  total_daily_revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pricing_automation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id),
  base_entry_fee NUMERIC DEFAULT 10.00,
  peak_multiplier NUMERIC DEFAULT 1.5,
  demand_factor NUMERIC DEFAULT 1.0,
  current_price NUMERIC DEFAULT 10.00,
  auto_adjust BOOLEAN DEFAULT true,
  last_adjustment TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.xbox_automation_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  xbox_console_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'offline',
  current_lobbies INTEGER DEFAULT 0,
  max_lobbies INTEGER DEFAULT 10,
  revenue_generated_today NUMERIC DEFAULT 0,
  uptime_hours NUMERIC DEFAULT 0,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  automation_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.revenue_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passive_income_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xbox_automation_status ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access and service access
CREATE POLICY "Admins can manage revenue automation" ON public.revenue_automation
FOR ALL USING (is_user_admin());

CREATE POLICY "Service can manage revenue automation" ON public.revenue_automation
FOR ALL USING (true);

CREATE POLICY "Admins can manage automated tournaments" ON public.automated_tournaments
FOR ALL USING (is_user_admin());

CREATE POLICY "Service can manage automated tournaments" ON public.automated_tournaments
FOR ALL USING (true);

CREATE POLICY "Admins can view passive income metrics" ON public.passive_income_metrics
FOR SELECT USING (is_user_admin());

CREATE POLICY "Service can manage passive income metrics" ON public.passive_income_metrics
FOR ALL USING (true);

CREATE POLICY "Admins can manage pricing automation" ON public.pricing_automation
FOR ALL USING (is_user_admin());

CREATE POLICY "Service can manage pricing automation" ON public.pricing_automation
FOR ALL USING (true);

CREATE POLICY "Admins can manage xbox automation status" ON public.xbox_automation_status
FOR ALL USING (is_user_admin());

CREATE POLICY "Service can manage xbox automation status" ON public.xbox_automation_status
FOR ALL USING (true);

-- Create functions for automation
CREATE OR REPLACE FUNCTION public.optimize_revenue_automation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update revenue optimization based on current metrics
  UPDATE public.revenue_automation 
  SET current_revenue_rate = (
    SELECT COALESCE(SUM(hourly_revenue), 0) 
    FROM public.passive_income_metrics 
    WHERE date = CURRENT_DATE
  ),
  updated_at = now()
  WHERE automation_type = 'xbox_server';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_automated_tournaments()
RETURNS VOID AS $$
DECLARE
  tournament_config RECORD;
BEGIN
  -- Create tournaments based on automation schedule
  FOR tournament_config IN 
    SELECT * FROM public.automated_tournaments 
    WHERE status = 'scheduled' 
    AND next_execution <= now()
  LOOP
    -- Insert new tournament (simplified - would need full tournament creation logic)
    INSERT INTO public.tournaments (
      title,
      description,
      entry_fee,
      max_participants,
      start_time,
      status,
      created_by_automation
    ) VALUES (
      'Automated Tournament #' || extract(epoch from now()),
      'Auto-generated tournament for passive income',
      (SELECT current_price FROM public.pricing_automation LIMIT 1),
      tournament_config.participant_target,
      now() + INTERVAL '1 hour',
      'open',
      true
    );
    
    -- Update automation schedule for next execution
    UPDATE public.automated_tournaments 
    SET next_execution = now() + INTERVAL '2 hours',
        status = 'executed'
    WHERE id = tournament_config.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for revenue optimization
CREATE TRIGGER optimize_revenue_trigger
  AFTER INSERT OR UPDATE ON public.passive_income_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.optimize_revenue_automation();