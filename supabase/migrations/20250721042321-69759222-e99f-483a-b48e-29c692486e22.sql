-- Fix all functions to have proper search_path settings to resolve security warnings

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set search path to prevent schema resolution surprises
    SET search_path = '';
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'display_name'
  );
  RETURN new;
END;
$$;

-- Update the update_premium_status function
CREATE OR REPLACE FUNCTION public.update_premium_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update profile premium status based on subscription
  UPDATE public.profiles 
  SET 
    is_premium = (NEW.status = 'active'),
    premium_expires_at = CASE 
      WHEN NEW.status = 'active' THEN NEW.current_period_end
      ELSE NULL 
    END,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Update the is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Update the update_admin_status function
CREATE OR REPLACE FUNCTION public.update_admin_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles 
    SET is_admin = true, updated_at = now()
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if user has any remaining admin roles
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = OLD.user_id AND role = 'admin'
    ) THEN
      UPDATE public.profiles 
      SET is_admin = false, updated_at = now()
      WHERE user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Update the expire_old_queue_entries function
CREATE OR REPLACE FUNCTION public.expire_old_queue_entries()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.match_queue 
  SET queue_status = 'expired'
  WHERE expires_at < now() 
    AND queue_status = 'searching';
  RETURN NULL;
END;
$$;

-- Update the cleanup_expired_queue_entries function
CREATE OR REPLACE FUNCTION public.cleanup_expired_queue_entries()
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  UPDATE public.match_queue 
  SET queue_status = 'expired'
  WHERE expires_at < now() 
    AND queue_status = 'searching';
END;
$$;