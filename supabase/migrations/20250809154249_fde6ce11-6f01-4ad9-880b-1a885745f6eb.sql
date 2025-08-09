-- Fix security issues (excluding views which can't have RLS)

-- Enable RLS on tables that are missing it (excluding views)
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY; 

-- Fix function search path issues for remaining functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'display_name'
  );
  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_automated_tournaments()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

-- Additional policies for games table (already has some)
CREATE POLICY "Admins can manage games"
  ON public.games FOR ALL
  USING (is_user_admin());

-- Additional policies for game_modes table (already has some)
CREATE POLICY "Admins can manage game modes"
  ON public.game_modes FOR ALL
  USING (is_user_admin());