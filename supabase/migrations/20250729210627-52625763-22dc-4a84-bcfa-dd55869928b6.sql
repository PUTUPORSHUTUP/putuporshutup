-- Create automated revenue tracking tables
CREATE TABLE public.platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_type TEXT NOT NULL, -- 'platform_fee', 'subscription', 'tournament_fee', 'sponsorship'
  amount NUMERIC NOT NULL,
  source_id UUID, -- Reference to challenge_id, subscription_id, tournament_id, etc.
  user_id UUID REFERENCES auth.users(id),
  automated BOOLEAN DEFAULT true,
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  fee_percentage NUMERIC,
  original_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sponsored tournaments table
CREATE TABLE public.sponsored_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  sponsor_name TEXT NOT NULL,
  sponsor_logo_url TEXT,
  prize_pool NUMERIC NOT NULL,
  sponsor_fee NUMERIC NOT NULL, -- Amount sponsor pays platform
  entry_fee NUMERIC DEFAULT 0, -- Entry fee (can be 0 for sponsored)
  max_participants INTEGER NOT NULL,
  game_id UUID REFERENCES games(id),
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'cancelled'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  automated_bracket BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create subscription revenue tracking
CREATE TABLE public.subscription_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  subscription_tier TEXT NOT NULL, -- 'basic', 'premium'
  amount NUMERIC NOT NULL,
  billing_period TEXT NOT NULL, -- 'monthly', 'yearly'
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
  next_billing_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create API verification revenue tracking
CREATE TABLE public.api_verification_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_name TEXT NOT NULL,
  verification_count INTEGER DEFAULT 0,
  automated_verifications INTEGER DEFAULT 0,
  manual_verifications INTEGER DEFAULT 0,
  cost_savings NUMERIC DEFAULT 0, -- Cost saved by automation
  revenue_generated NUMERIC DEFAULT 0, -- Revenue from automated games
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(game_name, date)
);

-- Enable RLS
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_verification_stats ENABLE ROW LEVEL SECURITY;

-- Platform revenue policies
CREATE POLICY "Admins can manage platform revenue" ON public.platform_revenue
FOR ALL USING (is_user_admin());

CREATE POLICY "Users can view their revenue contributions" ON public.platform_revenue
FOR SELECT USING (user_id = auth.uid());

-- Sponsored tournaments policies
CREATE POLICY "Everyone can view sponsored tournaments" ON public.sponsored_tournaments
FOR SELECT USING (true);

CREATE POLICY "Admins can manage sponsored tournaments" ON public.sponsored_tournaments
FOR ALL USING (is_user_admin());

CREATE POLICY "Creators can manage their tournaments" ON public.sponsored_tournaments
FOR ALL USING (created_by = auth.uid());

-- Subscription revenue policies
CREATE POLICY "Admins can view all subscription revenue" ON public.subscription_revenue
FOR SELECT USING (is_user_admin());

CREATE POLICY "Users can view their subscription info" ON public.subscription_revenue
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage subscription revenue" ON public.subscription_revenue
FOR ALL USING (true);

-- API verification stats policies
CREATE POLICY "Admins can manage API verification stats" ON public.api_verification_stats
FOR ALL USING (is_user_admin());

CREATE POLICY "Everyone can view API verification stats" ON public.api_verification_stats
FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_platform_revenue_type ON public.platform_revenue(revenue_type);
CREATE INDEX idx_platform_revenue_date ON public.platform_revenue(created_at);
CREATE INDEX idx_sponsored_tournaments_status ON public.sponsored_tournaments(status);
CREATE INDEX idx_subscription_revenue_user ON public.subscription_revenue(user_id);
CREATE INDEX idx_api_verification_date ON public.api_verification_stats(date);