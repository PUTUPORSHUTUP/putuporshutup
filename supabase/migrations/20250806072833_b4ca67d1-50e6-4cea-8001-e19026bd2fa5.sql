-- Create function to update VIP access based on trial/subscription status
CREATE OR REPLACE FUNCTION public.update_vip_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update VIP access based on trial or premium status
  NEW.vip_access := (
    NEW.is_premium = true OR 
    (NEW.is_vip_trial = true AND NEW.trial_start > now() - interval '7 days')
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update VIP access
CREATE TRIGGER update_profiles_vip_access
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vip_access();

-- Create function to start VIP trial
CREATE OR REPLACE FUNCTION public.start_vip_trial(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles 
  SET 
    is_vip_trial = true,
    trial_start = now(),
    vip_access = true,
    updated_at = now()
  WHERE user_id = user_id_param
    AND is_vip_trial = false  -- Only allow if not already on trial
    AND is_premium = false;   -- Only allow if not already premium
END;
$$;

-- Create function to check if user has valid VIP access
CREATE OR REPLACE FUNCTION public.has_vip_access(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = user_id_param 
    AND (
      is_premium = true OR 
      (is_vip_trial = true AND trial_start > now() - interval '7 days')
    )
  );
END;
$$;