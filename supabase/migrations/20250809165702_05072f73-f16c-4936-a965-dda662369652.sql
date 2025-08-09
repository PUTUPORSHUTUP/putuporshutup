-- ============================================
-- PUOSU: Wallet Safety + Admin Metrics + KPIs
-- ============================================

-- ---------- 1) Wallet hardening ----------
-- Ensure non-negative balances even under race conditions
DO $$
BEGIN
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'market_wallets_balance_nonneg'
    ) THEN
        ALTER TABLE market_wallets 
        ADD CONSTRAINT market_wallets_balance_nonneg 
        CHECK (balance_cents >= 0);
    END IF;
END $$;

-- Atomic, per-user locked debit with audit row
CREATE OR REPLACE FUNCTION wallet_debit_safe(
  p_user uuid,
  p_amount bigint,
  p_reason text default 'debit',
  p_match uuid default null
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new bigint;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount_must_be_positive';
  END IF;

  -- Per-user advisory lock to prevent concurrent overdrafts
  PERFORM pg_advisory_xact_lock(777, abs(hashtext(p_user::text)) % 2147483647);

  UPDATE market_wallets
     SET balance_cents = balance_cents - p_amount,
         updated_at = now()
   WHERE user_id = p_user
   RETURNING balance_cents INTO v_new;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;

  IF v_new < 0 THEN
    RAISE EXCEPTION 'insufficient_funds';
  END IF;

  INSERT INTO market_wallet_transactions(user_id, amount_cents, reason, ref_match)
  VALUES (p_user, -p_amount, COALESCE(p_reason,'debit'), p_match);
END;
$$;

-- Grant execute permissions
REVOKE ALL ON FUNCTION wallet_debit_safe(uuid, bigint, text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION wallet_debit_safe(uuid, bigint, text, uuid) TO authenticated, service_role;

-- ---------- 2) Admin daily metrics (lean) ----------
CREATE TABLE IF NOT EXISTS admin_metrics_daily (
  day date PRIMARY KEY,
  matches_created int NOT NULL DEFAULT 0,
  payouts_count int NOT NULL DEFAULT 0,
  payouts_cents bigint NOT NULL DEFAULT 0,
  failures int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION admin_metrics_rollup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date := CURRENT_DATE;
BEGIN
  INSERT INTO admin_metrics_daily(day, matches_created, payouts_count, payouts_cents, failures)
  VALUES (
    d,
    (SELECT count(*) FROM market_matches WHERE created_at::date = d),
    (SELECT count(*) FROM market_payouts WHERE created_at::date = d),
    (SELECT COALESCE(sum(amount_cents),0) FROM market_payouts WHERE created_at::date = d),
    (SELECT count(*) FROM market_events WHERE created_at::date = d AND error_message IS NOT NULL)
  )
  ON CONFLICT (day) DO UPDATE SET
    matches_created = EXCLUDED.matches_created,
    payouts_count   = EXCLUDED.payouts_count,
    payouts_cents   = EXCLUDED.payouts_cents,
    failures        = EXCLUDED.failures,
    updated_at      = now();
END;
$$;

REVOKE ALL ON FUNCTION admin_metrics_rollup() FROM public;
GRANT EXECUTE ON FUNCTION admin_metrics_rollup() TO service_role;

-- ---------- 3) Live KPIs (last 24h) ----------
CREATE OR REPLACE FUNCTION admin_kpis_last24()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok int := 0;
  v_err int := 0;
  v_pcount int := 0;
  v_pcent bigint := 0;
BEGIN
  -- Success/error counts from market_events
  SELECT
    sum(CASE WHEN error_message IS NULL THEN 1 ELSE 0 END),
    sum(CASE WHEN error_message IS NOT NULL THEN 1 ELSE 0 END)
  INTO v_ok, v_err
  FROM market_events
  WHERE created_at >= now() - interval '24 hours';

  -- Payout counts/totals from market_payouts
  SELECT
    count(*),
    COALESCE(sum(amount_cents),0)
  INTO v_pcount, v_pcent
  FROM market_payouts
  WHERE created_at >= now() - interval '24 hours';

  RETURN jsonb_build_object(
    'success_rate',
      CASE WHEN COALESCE(v_ok,0)+COALESCE(v_err,0)=0
           THEN 1.0
           ELSE (COALESCE(v_ok,0)::numeric / (COALESCE(v_ok,0)+COALESCE(v_err,0))) END,
    'payouts_count', COALESCE(v_pcount,0),
    'payouts_cents', COALESCE(v_pcent,0)
  );
END;
$$;

REVOKE ALL ON FUNCTION admin_kpis_last24() FROM public;
GRANT EXECUTE ON FUNCTION admin_kpis_last24() TO authenticated, service_role;

-- ---------- 4) Helpful indexes ----------
CREATE INDEX IF NOT EXISTS idx_market_events_created_at ON market_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_payouts_created_at ON market_payouts (created_at DESC);