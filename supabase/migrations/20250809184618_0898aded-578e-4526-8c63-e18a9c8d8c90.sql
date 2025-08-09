-- Create RPC functions for LiveEventsMonitor component

-- Public list: only safe fields from tournaments and challenges
CREATE OR REPLACE FUNCTION live_events_list_public()
RETURNS TABLE (
  id uuid, 
  title text, 
  mode_key text, 
  mode_label text,
  entry_fee_cents bigint, 
  prize_pool_cents bigint,
  players int, 
  max_players int,
  status text, 
  starts_at timestamptz, 
  ends_at timestamptz, 
  public_url text,
  payout_label text
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public 
AS $$
  -- Get tournaments
  SELECT 
    t.id,
    t.title,
    COALESCE(g.name, 'tournament') as mode_key,
    COALESCE(g.display_name, t.title) as mode_label,
    (t.entry_fee * 100)::bigint as entry_fee_cents,
    (t.prize_pool * 100)::bigint as prize_pool_cents,
    t.current_participants as players,
    t.max_participants as max_players,
    t.status,
    t.start_time as starts_at,
    t.registration_closes_at as ends_at,
    '/tournaments/' || t.id as public_url,
    'Winner Takes All' as payout_label
  FROM tournaments t
  LEFT JOIN games g ON t.game_id = g.id
  WHERE t.status IN ('open', 'in_progress', 'completed')
  
  UNION ALL
  
  -- Get challenges  
  SELECT 
    c.id,
    c.title,
    COALESCE(g.name, 'challenge') as mode_key,
    COALESCE(g.display_name, c.title) as mode_label,
    (c.stake_amount * 100)::bigint as entry_fee_cents,
    (c.total_pot * 100)::bigint as prize_pool_cents,
    (SELECT COUNT(*)::int FROM challenge_participants cp WHERE cp.challenge_id = c.id) as players,
    c.max_participants as max_players,
    c.status,
    c.start_time as starts_at,
    c.end_time as ends_at,
    '/games#challenge-' || c.id as public_url,
    'Winner Takes All' as payout_label
  FROM challenges c
  LEFT JOIN games g ON c.game_id = g.id
  WHERE c.status IN ('open', 'in_progress', 'completed')
  
  ORDER BY starts_at ASC NULLS LAST;
$$;

-- Admin list: includes everything (same as public for now, but can be extended)
CREATE OR REPLACE FUNCTION live_events_list_admin()
RETURNS TABLE (
  id uuid, 
  title text, 
  mode_key text, 
  mode_label text,
  entry_fee_cents bigint, 
  prize_pool_cents bigint,
  players int, 
  max_players int,
  status text, 
  starts_at timestamptz, 
  ends_at timestamptz, 
  public_url text,
  payout_label text
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public 
AS $$
  -- Get tournaments
  SELECT 
    t.id,
    t.title,
    COALESCE(g.name, 'tournament') as mode_key,
    COALESCE(g.display_name, t.title) as mode_label,
    (t.entry_fee * 100)::bigint as entry_fee_cents,
    (t.prize_pool * 100)::bigint as prize_pool_cents,
    t.current_participants as players,
    t.max_participants as max_players,
    t.status,
    t.start_time as starts_at,
    t.registration_closes_at as ends_at,
    '/tournaments/' || t.id as public_url,
    'Winner Takes All' as payout_label
  FROM tournaments t
  LEFT JOIN games g ON t.game_id = g.id
  WHERE t.status IN ('open', 'in_progress', 'completed')
  
  UNION ALL
  
  -- Get challenges  
  SELECT 
    c.id,
    c.title,
    COALESCE(g.name, 'challenge') as mode_key,
    COALESCE(g.display_name, c.title) as mode_label,
    (c.stake_amount * 100)::bigint as entry_fee_cents,
    (c.total_pot * 100)::bigint as prize_pool_cents,
    (SELECT COUNT(*)::int FROM challenge_participants cp WHERE cp.challenge_id = c.id) as players,
    c.max_participants as max_players,
    c.status,
    c.start_time as starts_at,
    c.end_time as ends_at,
    '/games#challenge-' || c.id as public_url,
    'Winner Takes All' as payout_label
  FROM challenges c
  LEFT JOIN games g ON c.game_id = g.id
  WHERE c.status IN ('open', 'in_progress', 'completed')
  
  ORDER BY starts_at ASC NULLS LAST;
$$;

-- Admin action: force refund
CREATE OR REPLACE FUNCTION admin_event_force_refund(p_event_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  -- Check if it's a tournament
  IF EXISTS(SELECT 1 FROM tournaments WHERE id = p_event_id) THEN
    UPDATE tournaments 
    SET status = 'cancelled', updated_at = now() 
    WHERE id = p_event_id;
    
    -- Log security event
    PERFORM log_security_event(
      'admin_force_refund_tournament',
      auth.uid(),
      jsonb_build_object('tournament_id', p_event_id)
    );
  -- Check if it's a challenge
  ELSIF EXISTS(SELECT 1 FROM challenges WHERE id = p_event_id) THEN
    UPDATE challenges 
    SET status = 'cancelled', updated_at = now() 
    WHERE id = p_event_id;
    
    -- Log security event
    PERFORM log_security_event(
      'admin_force_refund_challenge',
      auth.uid(),
      jsonb_build_object('challenge_id', p_event_id)
    );
  ELSE
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;
END;
$$;

-- Admin action: force payout
CREATE OR REPLACE FUNCTION admin_event_force_payout(p_event_id uuid)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
BEGIN
  -- Check if it's a tournament
  IF EXISTS(SELECT 1 FROM tournaments WHERE id = p_event_id) THEN
    UPDATE tournaments 
    SET status = 'completed', updated_at = now() 
    WHERE id = p_event_id;
    
    -- Log security event
    PERFORM log_security_event(
      'admin_force_payout_tournament',
      auth.uid(),
      jsonb_build_object('tournament_id', p_event_id)
    );
  -- Check if it's a challenge
  ELSIF EXISTS(SELECT 1 FROM challenges WHERE id = p_event_id) THEN
    UPDATE challenges 
    SET status = 'completed', updated_at = now() 
    WHERE id = p_event_id;
    
    -- Log security event
    PERFORM log_security_event(
      'admin_force_payout_challenge',
      auth.uid(),
      jsonb_build_object('challenge_id', p_event_id)
    );
  ELSE
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;
END;
$$;

-- Set proper permissions
GRANT EXECUTE ON FUNCTION live_events_list_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION live_events_list_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_event_force_refund(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_event_force_payout(uuid) TO authenticated;