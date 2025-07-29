-- Create automation configuration table
CREATE TABLE IF NOT EXISTS public.automation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type TEXT NOT NULL, -- 'dispute_resolution', 'tournament_scheduler', 'dynamic_pricing', 'fraud_detection', 'market_making'
  is_enabled BOOLEAN DEFAULT true,
  config_data JSONB NOT NULL DEFAULT '{}',
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_frequency_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create automated actions log
CREATE TABLE IF NOT EXISTS public.automated_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_type TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'dispute_resolved', 'tournament_created', 'price_updated', 'account_flagged', 'challenge_created'
  target_id UUID, -- Reference to dispute_id, tournament_id, etc.
  action_data JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create dynamic pricing rules
CREATE TABLE IF NOT EXISTS public.dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id),
  base_price NUMERIC NOT NULL DEFAULT 10.00,
  demand_multiplier NUMERIC DEFAULT 1.2, -- Increase price when demand is high
  supply_multiplier NUMERIC DEFAULT 0.8, -- Decrease price when supply is high
  min_price NUMERIC DEFAULT 5.00,
  max_price NUMERIC DEFAULT 100.00,
  current_price NUMERIC DEFAULT 10.00,
  last_updated TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fraud detection patterns
CREATE TABLE IF NOT EXISTS public.fraud_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name TEXT NOT NULL,
  pattern_type TEXT NOT NULL, -- 'win_rate', 'betting_pattern', 'stat_anomaly', 'timing_pattern'
  detection_criteria JSONB NOT NULL, -- Configurable criteria for detection
  severity_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  auto_action TEXT DEFAULT 'flag', -- 'flag', 'restrict', 'suspend', 'review'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create automated tournament templates
CREATE TABLE IF NOT EXISTS public.tournament_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  game_id UUID REFERENCES games(id),
  schedule_cron TEXT NOT NULL, -- Cron expression for scheduling
  max_participants INTEGER DEFAULT 16,
  entry_fee NUMERIC DEFAULT 10.00,
  prize_distribution JSONB DEFAULT '{"1st": 0.6, "2nd": 0.3, "3rd": 0.1}',
  tournament_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fraud_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage automation config" ON public.automation_config
FOR ALL USING (is_user_admin());

CREATE POLICY "Admins can view automation actions" ON public.automated_actions
FOR SELECT USING (is_user_admin());

CREATE POLICY "Everyone can view pricing rules" ON public.dynamic_pricing_rules
FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing rules" ON public.dynamic_pricing_rules
FOR ALL USING (is_user_admin());

CREATE POLICY "Admins can manage fraud patterns" ON public.fraud_patterns
FOR ALL USING (is_user_admin());

CREATE POLICY "Admins can manage tournament templates" ON public.tournament_templates
FOR ALL USING (is_user_admin());

CREATE POLICY "Everyone can view tournament templates" ON public.tournament_templates
FOR SELECT USING (is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_automation_config_type ON public.automation_config(automation_type);
CREATE INDEX IF NOT EXISTS idx_automation_config_next_run ON public.automation_config(next_run_at);
CREATE INDEX IF NOT EXISTS idx_automated_actions_type ON public.automated_actions(automation_type);
CREATE INDEX IF NOT EXISTS idx_automated_actions_created ON public.automated_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_game ON public.dynamic_pricing_rules(game_id);
CREATE INDEX IF NOT EXISTS idx_fraud_patterns_active ON public.fraud_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_tournament_templates_active ON public.tournament_templates(is_active);