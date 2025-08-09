-- CRITICAL SECURITY FIXES
-- Priority 1: Enable RLS on critical tables and add proper policies

-- 1. Enable RLS on market_wallets table and add policies
ALTER TABLE public.market_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet"
ON public.market_wallets
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet balance"
ON public.market_wallets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service can manage wallets"
ON public.market_wallets
FOR ALL
USING (is_service_role());

-- 2. Enable RLS on market_matches table and add policies
ALTER TABLE public.market_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their matches"
ON public.market_matches
FOR SELECT
USING (auth.uid() IN (player_a, player_b) OR is_user_admin());

CREATE POLICY "Service can manage matches"
ON public.market_matches
FOR ALL
USING (is_service_role());

-- 3. Enable RLS on market_match_results table and add policies
ALTER TABLE public.market_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view their match results"
ON public.market_match_results
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM market_matches m 
    WHERE m.id = match_id 
    AND auth.uid() IN (m.player_a, m.player_b)
  ) OR
  is_user_admin()
);

CREATE POLICY "Service can manage match results"
ON public.market_match_results
FOR ALL
USING (is_service_role());

-- 4. Enable RLS on market_payouts table and add policies
ALTER TABLE public.market_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Winners can view their payouts"
ON public.market_payouts
FOR SELECT
USING (auth.uid() = winner_id OR is_user_admin());

CREATE POLICY "Service can manage payouts"
ON public.market_payouts
FOR ALL
USING (is_service_role());

-- 5. Enable RLS on market_wallet_transactions table and add policies
ALTER TABLE public.market_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their wallet transactions"
ON public.market_wallet_transactions
FOR SELECT
USING (auth.uid() = user_id OR is_user_admin());

CREATE POLICY "Service can manage wallet transactions"
ON public.market_wallet_transactions
FOR ALL
USING (is_service_role());

-- 6. Enable RLS on market_queue table and add policies
ALTER TABLE public.market_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their queue entries"
ON public.market_queue
FOR SELECT
USING (auth.uid() = user_id OR is_user_admin());

CREATE POLICY "Users can manage their queue entries"
ON public.market_queue
FOR ALL
USING (auth.uid() = user_id OR is_service_role());

-- 7. Fix security definer functions - add proper search_path restrictions
-- Update existing functions to include SET search_path = 'public'

CREATE OR REPLACE FUNCTION public.market_wallet_credit(p_user_id uuid, p_amount_cents bigint, p_reason text, p_ref_match uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
begin
  if p_amount_cents <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  insert into market_wallet_transactions(user_id, amount_cents, reason, ref_match)
  values (p_user_id, p_amount_cents, p_reason, p_ref_match);

  update market_wallets
     set balance_cents = balance_cents + p_amount_cents,
         updated_at = now()
   where user_id = p_user_id;

  if not found then
    -- create wallet then credit
    insert into market_wallets(user_id, balance_cents) values (p_user_id, 0)
    on conflict (user_id) do update set balance_cents = excluded.balance_cents;

    update market_wallets
       set balance_cents = balance_cents + p_amount_cents,
           updated_at = now()
     where user_id = p_user_id;
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.market_payout_safe(p_match_id uuid, p_total_pot_cents bigint)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
declare
  v_fee_bp int := 1000; -- 10%
  v_pot_cents bigint := coalesce(p_total_pot_cents, 0);
  v_fee_cents bigint := (v_pot_cents * v_fee_bp) / 10000;
  v_net_pot bigint := greatest(v_pot_cents - v_fee_cents, 0);

  v_paid_count int := 0;
  u1 uuid; u2 uuid; u3 uuid;
  a1 bigint := 0; a2 bigint := 0; a3 bigint := 0;
  v_sum bigint := 0; v_remainder bigint := 0;
begin
  if v_net_pot <= 0 then
    return 0;
  end if;

  -- pull placements 1..3
  select user_id into u1 from market_match_results where match_id = p_match_id and placement = 1 limit 1;
  select user_id into u2 from market_match_results where match_id = p_match_id and placement = 2 limit 1;
  select user_id into u3 from market_match_results where match_id = p_match_id and placement = 3 limit 1;

  if u1 is not null then a1 := (v_net_pot * 50) / 100; end if;
  if u2 is not null then a2 := (v_net_pot * 30) / 100; end if;
  if u3 is not null then a3 := (v_net_pot * 20) / 100; end if;

  v_sum := coalesce(a1,0) + coalesce(a2,0) + coalesce(a3,0);
  v_remainder := greatest(v_net_pot - v_sum, 0);

  -- give leftover pennies fairly
  while v_remainder > 0 loop
    if u1 is not null and v_remainder > 0 then a1 := a1 + 1; v_remainder := v_remainder - 1; end if;
    if u2 is not null and v_remainder > 0 then a2 := a2 + 1; v_remainder := v_remainder - 1; end if;
    if u3 is not null and v_remainder > 0 then a3 := a3 + 1; v_remainder := v_remainder - 1; end if;
    exit when v_remainder = 0;
  end loop;

  -- insert payouts + credit wallets
  if u1 is not null and a1 > 0 then
    insert into market_payouts(match_id, winner_id, amount_cents, status)
    values (p_match_id, u1, a1, 'paid');
    perform market_wallet_credit(u1, a1, 'match_win', p_match_id);
    v_paid_count := v_paid_count + 1;
  end if;
  if u2 is not null and a2 > 0 then
    insert into market_payouts(match_id, winner_id, amount_cents, status)
    values (p_match_id, u2, a2, 'paid');
    perform market_wallet_credit(u2, a2, 'match_win', p_match_id);
    v_paid_count := v_paid_count + 1;
  end if;
  if u3 is not null and a3 > 0 then
    insert into market_payouts(match_id, winner_id, amount_cents, status)
    values (p_match_id, u3, a3, 'paid');
    perform market_wallet_credit(u3, a3, 'match_win', p_match_id);
    v_paid_count := v_paid_count + 1;
  end if;

  return v_paid_count;
end;
$$;

-- 8. Add additional security monitoring functions
CREATE OR REPLACE FUNCTION public.log_security_violation(
  p_violation_type text,
  p_user_id uuid DEFAULT auth.uid(),
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO security_events (
    event_type,
    user_id,
    details,
    severity
  ) VALUES (
    p_violation_type,
    p_user_id,
    p_details,
    'high'
  );
END;
$$;