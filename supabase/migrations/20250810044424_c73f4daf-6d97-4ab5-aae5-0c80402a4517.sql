-- FINAL SECURITY HARDENING - Address remaining linter issues

-- Fix remaining functions with mutable search_path
CREATE OR REPLACE FUNCTION public.create_default_security_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_auth_context()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  role_name TEXT;
  claims JSON;
BEGIN
  BEGIN
    role_name := current_setting('request.jwt.claims', true)::json->>'role';
    claims := current_setting('request.jwt.claims', true)::json;
    RETURN json_build_object('role', role_name, 'claims', claims);
  EXCEPTION WHEN others THEN
    RETURN json_build_object('error', SQLERRM);
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vip_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Update VIP status based on trial or premium status
  NEW.is_vip := (
    NEW.is_premium = true OR 
    (NEW.is_vip_trial = true AND COALESCE(NEW.vip_trial_start, NEW.trial_start) > now() - interval '7 days')
  );
  
  -- Update vip_access for backwards compatibility
  NEW.vip_access := NEW.is_vip;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_wallet_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent negative balances
  IF NEW.wallet_balance < 0 THEN
    RAISE EXCEPTION 'Wallet balance cannot be negative: %', NEW.wallet_balance;
  END IF;
  
  -- Log large balance changes
  IF OLD.wallet_balance IS NOT NULL AND 
     ABS(NEW.wallet_balance - OLD.wallet_balance) > 1000 THEN
    PERFORM log_security_event(
      'large_balance_change',
      NEW.user_id,
      jsonb_build_object(
        'old_balance', OLD.wallet_balance,
        'new_balance', NEW.wallet_balance,
        'difference', NEW.wallet_balance - OLD.wallet_balance
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.optimize_revenue_automation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Enable RLS on any remaining tables that might be missing it
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND NOT rowsecurity 
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT IN ('spatial_ref_sys')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        RAISE NOTICE 'Enabled RLS on %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- Add restrictive default policies for tables without any policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT t.schemaname, t.tablename
        FROM pg_tables t
        LEFT JOIN (
            SELECT schemaname, tablename, COUNT(*) as policy_count
            FROM pg_policies 
            WHERE schemaname = 'public'
            GROUP BY schemaname, tablename
        ) p ON t.schemaname = p.schemaname AND t.tablename = p.tablename
        WHERE t.schemaname = 'public'
        AND t.rowsecurity = true
        AND COALESCE(p.policy_count, 0) = 0
        AND t.tablename NOT LIKE 'pg_%'
        AND t.tablename NOT IN ('spatial_ref_sys')
    LOOP
        -- Add restrictive default policy - admin only
        EXECUTE format('CREATE POLICY "Admin only access" ON %I.%I FOR ALL USING (is_user_admin())', 
                      r.schemaname, r.tablename);
        RAISE NOTICE 'Added admin-only policy to %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;