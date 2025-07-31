CREATE OR REPLACE FUNCTION public.get_xbox_profile(gamertag text)
 RETURNS TABLE(xuid text, gamer_score integer, last_played timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.xbox_xuid as xuid,
    COALESCE(xls.total_score, 0)::integer as gamer_score,
    xls.last_match_at as last_played
  FROM profiles p
  LEFT JOIN xbox_leaderboard_stats xls ON p.xbox_xuid = xls.xuid
  WHERE p.xbox_gamertag ILIKE gamertag
  LIMIT 1;
END;
$function$