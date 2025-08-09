-- ci/check_security.sql
-- Fail the pipeline if core security conditions are not met.

-- 1) All public tables must have RLS enabled (allow a small ignore list)
DO $$
DECLARE
  v_cnt int;
BEGIN
  SELECT count(*) INTO v_cnt
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relname NOT IN (
      -- add any harmless tables here if needed
      'spatial_ref_sys'
    )
    AND c.relrowsecurity IS FALSE;

  IF v_cnt > 0 THEN
    RAISE EXCEPTION 'CI FAIL: % public tables without RLS enabled.', v_cnt;
  END IF;
END$$;

-- 2) No FORCE RLS on tables that definer functions must write to
-- (definer functions bypass normal RLS but FORCE would still block!)
DO $$
DECLARE
  v_names text[];
  v_bad int;
BEGIN
  v_names := ARRAY[
    'market_wallets','market_wallet_transactions','market_queue',
    'market_matches','market_match_results','market_payouts',
    'automation_status','automation_jobs','automation_heartbeats',
    'admin_metrics_daily','security_settings','market_withdrawals'
  ];
  SELECT count(*) INTO v_bad
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname='public'
    AND c.relkind='r'
    AND c.relname = ANY(v_names)
    AND c.relforcerowsecurity = TRUE;

  IF v_bad > 0 THEN
    RAISE EXCEPTION 'CI FAIL: FORCE RLS is enabled on % critical table(s).', v_bad;
  END IF;
END$$;

-- 3) No PUBLIC/ANON execute on functions (must be narrowed)
DO $$
DECLARE v_cnt int;
BEGIN
  SELECT count(*) INTO v_cnt
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (
      has_function_privilege('public', p.oid, 'EXECUTE')
      OR has_function_privilege('anon',   p.oid, 'EXECUTE')
    );

  IF v_cnt > 0 THEN
    RAISE EXCEPTION 'CI FAIL: % function(s) grant EXECUTE to PUBLIC/ANON.', v_cnt;
  END IF;
END$$;

-- 4) All SECURITY DEFINER functions must set search_path=public
DO $$
DECLARE v_cnt int;
BEGIN
  SELECT count(*) INTO v_cnt
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND p.prosecdef = TRUE
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) cfg
      WHERE cfg ILIKE 'search_path=public%'
    );

  IF v_cnt > 0 THEN
    RAISE EXCEPTION 'CI FAIL: % SECURITY DEFINER function(s) missing search_path=public.', v_cnt;
  END IF;
END$$;

-- 5) No broad table DML grants to ANON/AUTHENTICATED
DO $$
DECLARE v_cnt int;
BEGIN
  SELECT count(*) INTO v_cnt
  FROM information_schema.role_table_grants g
  WHERE g.table_schema='public'
    AND g.grantee IN ('anon','authenticated')
    AND g.privilege_type IN ('INSERT','UPDATE','DELETE');

  IF v_cnt > 0 THEN
    RAISE EXCEPTION 'CI FAIL: % broad DML grant(s) to anon/authenticated.', v_cnt;
  END IF;
END$$;

-- 6) Sanity: wallet invariant trigger present (constraint protection)
-- If you renamed the constraint, adjust here.
DO $$
DECLARE v_cnt int;
BEGIN
  SELECT count(*) INTO v_cnt
  FROM pg_constraint c
  JOIN pg_class t ON t.oid=c.conrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='public'
    AND t.relname='market_wallets'
    AND c.conname='market_wallets_balance_nonneg';

  IF v_cnt = 0 THEN
    RAISE EXCEPTION 'CI FAIL: market_wallets non-negative balance constraint missing.';
  END IF;
END$$;

-- 7) RLS policies exist on key financial tables
DO $$
DECLARE v_missing int;
BEGIN
  WITH critical AS (
    SELECT unnest(ARRAY[
      'market_wallets','market_wallet_transactions',
      'market_matches','market_match_results','market_payouts',
      'market_withdrawals'
    ]) AS tab
  )
  SELECT count(*) INTO v_missing
  FROM critical c
  LEFT JOIN pg_policies p ON p.schemaname='public' AND p.tablename=c.tab
  GROUP BY c.tab
  HAVING count(p.*)=0;

  IF FOUND THEN
    RAISE EXCEPTION 'CI FAIL: One or more critical tables have 0 RLS policies.';
  END IF;
END$$;

-- If we got here without exceptions, pass.