-- ============================================
-- PUOSU: Wallet Safety + Admin Metrics + KPIs
-- ============================================

-- Extensions
create extension if not exists pgcrypto;

-- ---------- 1) Wallet hardening ----------
-- Ensure non-negative balances even under race conditions
alter table if exists market_wallets
  add constraint if not exists market_wallets_balance_nonneg
  check (balance_cents >= 0);

-- Atomic, per-user locked debit with audit row
create or replace function wallet_debit_safe(
  p_user uuid,
  p_amount bigint,
  p_reason text default 'debit',
  p_match uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new bigint;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  -- Per-user advisory lock to prevent concurrent overdrafts
  perform pg_advisory_xact_lock(777, coalesce(p_user, '00000000-0000-0000-0000-000000000000')::uuid::bigint);

  update market_wallets
     set balance_cents = balance_cents - p_amount,
         updated_at = now()
   where user_id = p_user
   returning balance_cents into v_new;

  if not found then
    raise exception 'wallet_not_found';
  end if;

  if v_new < 0 then
    raise exception 'insufficient_funds';
  end if;

  insert into market_wallet_transactions(user_id, amount_cents, reason, ref_match)
  values (p_user, -p_amount, coalesce(p_reason,'debit'), p_match);
end;
$$;

-- Optional: basic execute grants (your service role bypasses RLS anyway)
revoke all on function wallet_debit_safe(uuid, bigint, text, uuid) from public;
grant execute on function wallet_debit_safe(uuid, bigint, text, uuid) to authenticated, service_role;

-- ---------- 2) Admin daily metrics (lean) ----------
create table if not exists admin_metrics_daily (
  day date primary key,
  matches_created int not null default 0,
  payouts_count int not null default 0,
  payouts_cents bigint not null default 0,
  failures int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function admin_metrics_rollup()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := current_date;
begin
  insert into admin_metrics_daily(day, matches_created, payouts_count, payouts_cents, failures)
  values (
    d,
    (select count(*) from market_matches where created_at::date = d),
    (select count(*) from market_payouts where created_at::date = d),
    (select coalesce(sum(amount_cents),0) from market_payouts where created_at::date = d),
    (select count(*) from market_runs where ran_at::date = d and status = 'error')
  )
  on conflict (day) do update set
    matches_created = excluded.matches_created,
    payouts_count   = excluded.payouts_count,
    payouts_cents   = excluded.payouts_cents,
    failures        = excluded.failures,
    updated_at      = now();
end;
$$;

revoke all on function admin_metrics_rollup() from public;
grant execute on function admin_metrics_rollup() to service_role;  -- schedule with service role

-- ---------- 3) Live KPIs (last 24h) ----------
-- Combines success rate + payout totals into one JSON payload for easy UI use
create or replace function admin_kpis_last24()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok int := 0;
  v_err int := 0;
  v_pcount int := 0;
  v_pcent bigint := 0;
begin
  -- Success/error counts from market_runs
  select
    sum((status='success')::int),
    sum((status='error')::int)
  into v_ok, v_err
  from market_runs
  where ran_at >= now() - interval '24 hours';

  -- Payout counts/totals from market_payouts
  select
    count(*),
    coalesce(sum(amount_cents),0)
  into v_pcount, v_pcent
  from market_payouts
  where created_at >= now() - interval '24 hours';

  return jsonb_build_object(
    'success_rate',
      case when coalesce(v_ok,0)+coalesce(v_err,0)=0
           then 1.0
           else (coalesce(v_ok,0)::numeric / (coalesce(v_ok,0)+coalesce(v_err,0))) end,
    'payouts_count', coalesce(v_pcount,0),
    'payouts_cents', coalesce(v_pcent,0)
  );
end;
$$;

revoke all on function admin_kpis_last24() from public;
grant execute on function admin_kpis_last24() to authenticated, service_role;

-- ---------- 4) Helpful index for market_runs ----------
create index if not exists idx_market_runs_ran_at on market_runs (ran_at desc);

-- ---------- 5) (Optional) quick smoke test ----------
-- select admin_kpis_last24();