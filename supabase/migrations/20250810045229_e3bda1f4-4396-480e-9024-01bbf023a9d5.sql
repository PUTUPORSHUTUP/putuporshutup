-- Fix remaining security definer functions without proper search_path

CREATE OR REPLACE FUNCTION public.auto_scale_players()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Ensure we always have at least 20 test users with sufficient balance
  IF (SELECT COUNT(*) FROM profiles WHERE is_test_user = true AND wallet_balance >= 100) < 20 THEN
    INSERT INTO profiles (user_id, username, display_name, wallet_balance, is_test_user, is_test_account)
    SELECT 
      gen_random_uuid(),
      'auto_user_' || substr(gen_random_uuid()::text, 1, 8),
      'Auto Player ' || generate_series,
      1000.00,
      true,
      true
    FROM generate_series(1, 10);
    
    -- Log the auto-scaling event
    INSERT INTO market_events (event_type, details)
    VALUES ('auto_scale_players', jsonb_build_object(
      'created_players', 10,
      'timestamp', now(),
      'trigger_reason', 'insufficient_test_users'
    ));
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_platform_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  health_report jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'market_engine', jsonb_build_object(
      'success_rate', COALESCE(
        (SELECT 
          ROUND(
            (COUNT(*) FILTER (WHERE error_message IS NULL)::numeric / COUNT(*)) * 100, 2
          )
        FROM market_events 
        WHERE created_at > now() - interval '24 hours'), 0
      ),
      'avg_duration_ms', COALESCE(
        (SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000)
         FROM market_events 
         WHERE created_at > now() - interval '24 hours'
         AND error_message IS NULL), 0
      ),
      'total_cycles_24h', (
        SELECT COUNT(*) 
        FROM market_events 
        WHERE created_at > now() - interval '24 hours'
      )
    ),
    'player_pool', jsonb_build_object(
      'total_test_users', (SELECT COUNT(*) FROM profiles WHERE is_test_user = true),
      'active_balance_users', (SELECT COUNT(*) FROM profiles WHERE is_test_user = true AND wallet_balance >= 100),
      'avg_balance', COALESCE((SELECT AVG(wallet_balance) FROM profiles WHERE is_test_user = true), 0)
    ),
    'financial_integrity', jsonb_build_object(
      'successful_payouts_24h', (
        SELECT COUNT(*) 
        FROM market_payouts 
        WHERE created_at > now() - interval '24 hours'
        AND status = 'paid'
      ),
      'total_payout_amount_24h', COALESCE((
        SELECT SUM(amount_cents) 
        FROM market_payouts 
        WHERE created_at > now() - interval '24 hours'
        AND status = 'paid'
      ), 0)
    ),
    'system_status', CASE 
      WHEN (SELECT COUNT(*) FROM profiles WHERE is_test_user = true AND wallet_balance >= 100) >= 20 THEN 'healthy'
      WHEN (SELECT COUNT(*) FROM profiles WHERE is_test_user = true AND wallet_balance >= 100) >= 10 THEN 'warning'
      ELSE 'critical'
    END
  ) INTO health_report;
  
  RETURN health_report;
END;
$function$;

CREATE OR REPLACE FUNCTION public.weekly_maintenance()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Vacuum analyze high-traffic tables
  VACUUM ANALYZE market_events;
  VACUUM ANALYZE market_matches;
  VACUUM ANALYZE market_payouts;
  VACUUM ANALYZE profiles;
  VACUUM ANALYZE market_wallets;
  
  -- Log maintenance completion
  INSERT INTO market_events (event_type, details)
  VALUES ('weekly_maintenance', jsonb_build_object(
    'completed_at', now(),
    'tables_vacuumed', ARRAY['market_events', 'market_matches', 'market_payouts', 'profiles', 'market_wallets']
  ));
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_system_alert(p_alert_type text, p_severity text, p_message text, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  alert_id uuid;
BEGIN
  INSERT INTO system_alerts (alert_type, severity, message, metadata)
  VALUES (p_alert_type, p_severity, p_message, p_metadata)
  RETURNING id INTO alert_id;
  
  -- Log to market_events for historical tracking
  INSERT INTO market_events (event_type, details)
  VALUES ('system_alert_generated', jsonb_build_object(
    'alert_id', alert_id,
    'alert_type', p_alert_type,
    'severity', p_severity,
    'message', p_message
  ));
  
  RETURN alert_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_automated_tournaments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
      (SELECT current_price FROM public.dynamic_pricing_rules LIMIT 1),
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
$function$;