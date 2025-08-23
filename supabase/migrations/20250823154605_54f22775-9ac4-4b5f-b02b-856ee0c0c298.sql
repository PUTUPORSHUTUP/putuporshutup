-- Drop and recreate find_stuck_matches function with correct column names
DROP FUNCTION IF EXISTS public.find_stuck_matches(integer);

CREATE FUNCTION public.find_stuck_matches(p_minutes integer DEFAULT 30)
 RETURNS TABLE(id uuid, queued_at timestamp with time zone, user_id uuid, stake_amount numeric, game_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    mq.id,
    mq.queued_at,
    mq.user_id,
    mq.stake_amount,
    mq.game_id
  FROM public.match_queue mq
  WHERE mq.queue_status = 'searching'
    AND mq.automated = true
    AND mq.queued_at < now() - (p_minutes || ' minutes')::interval;
END;
$function$;