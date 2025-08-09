-- Fix function search path warnings and security issues

-- Update functions to use proper search path and security definer settings
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete expired and unverified OTPs (more aggressive cleanup)
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() 
    AND verified_at IS NULL;
    
  -- Delete verified OTPs older than 1 hour for cleanup
  DELETE FROM public.otp_verifications 
  WHERE verified_at IS NOT NULL 
    AND verified_at < now() - interval '1 hour';
    
  -- Log cleanup activity for security monitoring
  PERFORM log_security_event(
    'otp_cleanup',
    NULL,
    jsonb_build_object(
      'cleaned_at', now(),
      'action', 'expired_otp_cleanup'
    )
  );
END;
$function$;

-- Update monitor_auth_events function with proper search path
CREATE OR REPLACE FUNCTION public.monitor_auth_events()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log authentication events for security monitoring
  PERFORM log_security_event(
    'auth_event',
    NEW.id,
    jsonb_build_object(
      'action', TG_OP,
      'email', NEW.email,
      'last_sign_in_at', NEW.last_sign_in_at,
      'confirmed_at', NEW.confirmed_at
    )
  );
  
  RETURN NEW;
END;
$function$;

-- Update expire_old_queue_entries function with proper search path
CREATE OR REPLACE FUNCTION public.expire_old_queue_entries()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.market_queue 
  SET status = 'expired'
  WHERE created_at < now() - interval '1 hour'
    AND status = 'waiting';
  RETURN NULL;
END;
$function$;

-- Update auto_payout_challenge function with proper search path
CREATE OR REPLACE FUNCTION public.auto_payout_challenge()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if challenge is marked as completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.status != 'completed') THEN
    -- Log the payout trigger for audit purposes
    PERFORM log_security_event(
      'auto_payout_triggered',
      NEW.creator_id,
      jsonb_build_object(
        'challenge_id', NEW.id,
        'winner_id', NEW.winner_id,
        'total_pot', NEW.total_pot
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update auto_payout_tournament function with proper search path
CREATE OR REPLACE FUNCTION public.auto_payout_tournament()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger if tournament is marked as completed and has a winner
  IF NEW.status = 'completed' AND NEW.winner_id IS NOT NULL AND (OLD.winner_id IS NULL OR OLD.status != 'completed') THEN
    -- Log the payout trigger for audit purposes
    PERFORM log_security_event(
      'auto_tournament_payout_triggered',
      NEW.creator_id,
      jsonb_build_object(
        'tournament_id', NEW.id,
        'winner_id', NEW.winner_id,
        'prize_pool', NEW.prize_pool
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;