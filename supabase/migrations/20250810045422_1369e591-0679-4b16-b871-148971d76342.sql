-- Convert security definer views to secure functions

-- Drop the problematic views and replace with functions
DROP VIEW IF EXISTS public.auth_diagnostics;
DROP VIEW IF EXISTS public.payout_guard;  
DROP VIEW IF EXISTS public.test_user_status;

-- Replace auth_diagnostics view with secure function
CREATE OR REPLACE FUNCTION public.get_auth_diagnostics()
RETURNS TABLE(
  match_id uuid,
  created_at timestamp with time zone,
  event_type text,
  status text,
  error_message text,
  error_time timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    entity_id AS match_id,
    pal.created_at,
    pal.event_type,
    pal.status,
    pal.error_message,
    pal.created_at AS error_time
  FROM payout_automation_log pal
  WHERE event_type = ANY (ARRAY['payout_error'::text, 'payout_error_421'::text, 'payout_fetch_error'::text, 'payout_failed'::text, 'sim_diag'::text])
  ORDER BY pal.created_at DESC;
END;
$function$;

-- Replace payout_guard view with secure function
CREATE OR REPLACE FUNCTION public.get_payout_guard()
RETURNS TABLE(
  challenge_id uuid,
  status text,
  winner_id uuid,
  settled_at timestamp with time zone,
  settlement_attempts integer,
  payout_status text,
  error_message text,
  processed_at timestamp with time zone,
  payout_amount numeric,
  participant_count bigint,
  total_pot numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS challenge_id,
    c.status,
    c.winner_id,
    c.settled_at,
    c.settlement_attempts,
    pal.status AS payout_status,
    pal.error_message,
    pal.processed_at,
    pal.payout_amount,
    count(cp.user_id) AS participant_count,
    sum(cp.stake_paid) AS total_pot
  FROM challenges c
  LEFT JOIN payout_automation_log pal ON ((pal.entity_id = c.id) AND (pal.entity_type = 'challenge'::text))
  LEFT JOIN challenge_participants cp ON (cp.challenge_id = c.id)
  WHERE c.created_at > (now() - interval '24 hours')
  GROUP BY c.id, c.status, c.winner_id, c.settled_at, c.settlement_attempts, pal.status, pal.error_message, pal.processed_at, pal.payout_amount
  ORDER BY c.created_at DESC;
END;
$function$;

-- Replace test_user_status view with secure function  
CREATE OR REPLACE FUNCTION public.get_test_user_status()
RETURNS TABLE(
  id uuid,
  username text,
  wallet_balance numeric,
  last_used timestamp with time zone,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    user_id AS id,
    p.username,
    p.wallet_balance,
    p.updated_at AS last_used,
    CASE
      WHEN p.wallet_balance >= 5 THEN 'available'::text
      ELSE 'insufficient_balance'::text
    END AS status
  FROM profiles p
  WHERE is_test_account = true
  ORDER BY p.wallet_balance DESC, p.updated_at;
END;
$function$;

-- Grant appropriate permissions on these functions
REVOKE EXECUTE ON FUNCTION public.get_auth_diagnostics() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_payout_guard() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_test_user_status() FROM PUBLIC;

-- Grant to admin users only
GRANT EXECUTE ON FUNCTION public.get_auth_diagnostics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_payout_guard() TO authenticated; 
GRANT EXECUTE ON FUNCTION public.get_test_user_status() TO authenticated;