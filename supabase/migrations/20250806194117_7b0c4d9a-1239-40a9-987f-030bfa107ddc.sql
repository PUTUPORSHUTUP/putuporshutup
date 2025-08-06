-- Fix remaining database function security issues

-- Update all remaining functions to have proper search_path
CREATE OR REPLACE FUNCTION public.detect_suspicious_stats(user_id_param uuid, stats_data jsonb, game_mode text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  kills integer;
  deaths integer;
  kd_ratio numeric;
  headshot_percentage numeric;
  damage_per_kill numeric;
  is_suspicious boolean := false;
  profile_exists boolean := false;
BEGIN
  -- Check if profile exists first
  SELECT EXISTS(SELECT 1 FROM profiles WHERE user_id = user_id_param) INTO profile_exists;
  
  IF NOT profile_exists THEN
    RETURN false; -- Don't flag if profile doesn't exist
  END IF;
  
  -- Extract common stats
  kills := COALESCE((stats_data->>'kills')::integer, 0);
  deaths := COALESCE((stats_data->>'deaths')::integer, 1); -- Avoid division by zero
  
  -- Calculate ratios
  kd_ratio := kills::numeric / deaths::numeric;
  
  -- Check for impossible headshot percentage
  IF stats_data ? 'headshot_percentage' THEN
    headshot_percentage := (stats_data->>'headshot_percentage')::numeric;
    IF headshot_percentage > 90 AND kills > 10 THEN
      is_suspicious := true;
    END IF;
  END IF;
  
  -- Check for impossible K/D ratios
  IF kd_ratio > 20 AND kills > 15 THEN
    is_suspicious := true;
  END IF;
  
  -- Check for impossible damage per kill ratios
  IF stats_data ? 'damage_dealt' AND kills > 0 THEN
    damage_per_kill := (stats_data->>'damage_dealt')::numeric / kills;
    IF damage_per_kill > 1000 THEN -- Assuming max damage per kill threshold
      is_suspicious := true;
    END IF;
  END IF;
  
  -- If suspicious, log it
  IF is_suspicious THEN
    INSERT INTO suspicious_activities (
      user_id, 
      activity_type, 
      description, 
      severity
    ) VALUES (
      user_id_param,
      'impossible_stats',
      format('Suspicious stats detected: K/D: %s, HS%%: %s', kd_ratio, headshot_percentage),
      'high'
    );
  END IF;
  
  RETURN is_suspicious;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_analytics(hide_test_data boolean DEFAULT false)
RETURNS TABLE(total_deposits numeric, total_withdrawals numeric, active_premium_users bigint, total_users bigint, total_tournaments bigint, total_challenges bigint, transactions_today bigint, tournaments_this_week bigint, new_users_this_week bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(deposits.total, 0) as total_deposits,
    COALESCE(withdrawals.total, 0) as total_withdrawals,
    COALESCE(premium_users.count, 0) as active_premium_users,
    COALESCE(all_users.count, 0) as total_users,
    COALESCE(all_tournaments.count, 0) as total_tournaments,
    COALESCE(all_challenges.count, 0) as total_challenges,
    COALESCE(today_transactions.count, 0) as transactions_today,
    COALESCE(week_tournaments.count, 0) as tournaments_this_week,
    COALESCE(week_users.count, 0) as new_users_this_week
  FROM 
    (SELECT 1) as dummy_table
  LEFT JOIN (
    SELECT SUM(amount) as total
    FROM transactions 
    WHERE type = 'deposit' 
    AND status = 'completed'
    AND (NOT hide_test_data OR user_id NOT IN (
      SELECT user_id FROM profiles 
      WHERE username ILIKE '%test%' OR display_name ILIKE '%test%'
    ))
  ) deposits ON true
  LEFT JOIN (
    SELECT SUM(amount) as total
    FROM transactions 
    WHERE type = 'withdrawal' 
    AND status = 'completed'
    AND (NOT hide_test_data OR user_id NOT IN (
      SELECT user_id FROM profiles 
      WHERE username ILIKE '%test%' OR display_name ILIKE '%test%'
    ))
  ) withdrawals ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM profiles 
    WHERE is_premium = true
    AND (NOT hide_test_data OR (username NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%'))
  ) premium_users ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM profiles
    WHERE (NOT hide_test_data OR (username NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%'))
  ) all_users ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM tournaments
    WHERE (NOT hide_test_data OR title NOT ILIKE '%test%')
  ) all_tournaments ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM challenges
    WHERE (NOT hide_test_data OR title NOT ILIKE '%test%')
  ) all_challenges ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM transactions 
    WHERE DATE(created_at) = CURRENT_DATE
    AND (NOT hide_test_data OR user_id NOT IN (
      SELECT user_id FROM profiles 
      WHERE username ILIKE '%test%' OR display_name ILIKE '%test%'
    ))
  ) today_transactions ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM tournaments 
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND (NOT hide_test_data OR title NOT ILIKE '%test%')
  ) week_tournaments ON true
  LEFT JOIN (
    SELECT COUNT(*) as count
    FROM profiles 
    WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)
    AND (NOT hide_test_data OR (username NOT ILIKE '%test%' AND display_name NOT ILIKE '%test%'))
  ) week_users ON true;
END;
$function$;