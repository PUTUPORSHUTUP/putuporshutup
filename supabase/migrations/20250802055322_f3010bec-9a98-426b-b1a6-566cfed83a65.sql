-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.optimize_revenue_automation()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.generate_automated_tournaments()
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
      (SELECT current_price FROM public.pricing_automation LIMIT 1),
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
$$;