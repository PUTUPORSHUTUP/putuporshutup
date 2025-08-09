-- Create missing tables and functions for db_market_run with correct syntax

-- 1. Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create match_queue table  
CREATE TABLE IF NOT EXISTS public.match_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  game_key TEXT NOT NULL,
  stake_cents BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- 3. Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'running',
  game_key TEXT NOT NULL,
  stake_cents BIGINT NOT NULL,
  player_a UUID NOT NULL,
  player_b UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create match_results table
CREATE TABLE IF NOT EXISTS public.match_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL,
  user_id UUID NOT NULL,
  placement INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  kills INTEGER DEFAULT 0,
  deaths INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create the payout function with correct PostgreSQL syntax
CREATE OR REPLACE FUNCTION public.db_market_payout_safe(p_match_id UUID, p_pot_cents BIGINT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid_rows INTEGER := 0;
  v_net_pot BIGINT;
  v_first_place BIGINT;
  v_second_place BIGINT;
  v_count INTEGER;
BEGIN
  -- Calculate net pot after 10% fee
  v_net_pot := p_pot_cents * 0.9;
  
  -- Calculate payouts (60% first, 30% second)
  v_first_place := v_net_pot * 0.6;
  v_second_place := v_net_pot * 0.3;
  -- Remaining 10% goes to house/platform
  
  -- Pay first place (placement = 1)
  UPDATE wallets 
  SET balance_cents = balance_cents + v_first_place,
      updated_at = NOW()
  FROM match_results mr
  WHERE wallets.user_id = mr.user_id
    AND mr.match_id = p_match_id 
    AND mr.placement = 1;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_paid_rows := v_count;
  
  -- Pay second place (placement = 2) 
  UPDATE wallets 
  SET balance_cents = balance_cents + v_second_place,
      updated_at = NOW()
  FROM match_results mr
  WHERE wallets.user_id = mr.user_id
    AND mr.match_id = p_match_id 
    AND mr.placement = 2;
    
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_paid_rows := v_paid_rows + v_count;
  
  RETURN v_paid_rows;
END;
$$;

-- Enable RLS and create policies
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_queue ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service can manage wallets"
  ON public.wallets FOR ALL
  USING (true);

CREATE POLICY "Service can manage match queue"  
  ON public.match_queue FOR ALL
  USING (true);

CREATE POLICY "Service can manage matches"
  ON public.matches FOR ALL  
  USING (true);

CREATE POLICY "Service can manage match results"
  ON public.match_results FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.match_queue TO service_role;  
GRANT ALL ON public.matches TO service_role;
GRANT ALL ON public.match_results TO service_role;
GRANT EXECUTE ON FUNCTION public.db_market_payout_safe(UUID, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.db_market_run(BOOLEAN) TO anon, authenticated, service_role;