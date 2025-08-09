-- Drop existing function and create missing tables for db_market_run

-- Drop existing function first
DROP FUNCTION IF EXISTS public.db_market_payout_safe;

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

-- 5. Create the payout function that db_market_run calls
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
    
  GET DIAGNOSTICS v_paid_rows = ROW_COUNT;
  
  -- Pay second place (placement = 2) 
  UPDATE wallets 
  SET balance_cents = balance_cents + v_second_place,
      updated_at = NOW()
  FROM match_results mr
  WHERE wallets.user_id = mr.user_id
    AND mr.match_id = p_match_id 
    AND mr.placement = 2;
    
  GET DIAGNOSTICS v_paid_rows = v_paid_rows + ROW_COUNT;
  
  RETURN v_paid_rows;
END;
$$;