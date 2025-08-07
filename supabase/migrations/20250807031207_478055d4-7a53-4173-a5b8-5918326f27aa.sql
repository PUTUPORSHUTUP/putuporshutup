-- Add VIP trial columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vip_trial_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;

-- Update existing VIP access logic function
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

-- Create trigger to automatically update VIP status
DROP TRIGGER IF EXISTS trigger_update_vip_status ON public.profiles;
CREATE TRIGGER trigger_update_vip_status
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vip_status();

-- Function to start VIP trial with new column
CREATE OR REPLACE FUNCTION public.start_vip_trial_v2(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE profiles 
  SET 
    is_vip_trial = true,
    vip_trial_start = now(),
    trial_start = now(), -- Keep for backwards compatibility
    is_vip = true,
    vip_access = true,
    updated_at = now()
  WHERE user_id = user_id_param
    AND is_vip_trial = false  -- Only allow if not already on trial
    AND is_premium = false;   -- Only allow if not already premium
END;
$function$;

-- Function to check VIP access with new columns
CREATE OR REPLACE FUNCTION public.has_vip_access_v2(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_id_param 
    AND (
      is_premium = true OR 
      is_vip = true OR
      (is_vip_trial = true AND COALESCE(vip_trial_start, trial_start) > now() - interval '7 days')
    )
  );
END;
$function$;