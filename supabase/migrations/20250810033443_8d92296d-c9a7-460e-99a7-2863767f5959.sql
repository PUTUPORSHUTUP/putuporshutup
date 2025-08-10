-- CRITICAL SECURITY FIXES - CORRECTED VERSION
-- Phase 1: Enable RLS on critical tables and add restrictive policies

-- Enable RLS on missing critical tables
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Secure matches table - only participants and admins can view
CREATE POLICY "Users can view their own matches" ON public.matches
FOR SELECT USING (
  player_a = auth.uid() OR 
  player_b = auth.uid() OR
  is_user_admin()
);

CREATE POLICY "System can create matches" ON public.matches
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage matches" ON public.matches
FOR ALL USING (is_user_admin());

-- Secure security_settings_audit - admin only
CREATE POLICY "Admins can view security audit" ON public.security_settings_audit
FOR SELECT USING (is_user_admin());

CREATE POLICY "System can log security events" ON public.security_settings_audit
FOR INSERT WITH CHECK (true);

-- Secure wallet_transactions - users can only see their own
CREATE POLICY "Users can view their own wallet transactions" ON public.wallet_transactions
FOR SELECT USING (profile_id = auth.uid() OR is_user_admin());

CREATE POLICY "System can create wallet transactions" ON public.wallet_transactions
FOR INSERT WITH CHECK (true);

-- Phase 2: Secure role-based access control
-- Add RLS policies to prevent role escalation attacks

CREATE POLICY "Prevent user role self-assignment" ON public.user_roles
FOR INSERT WITH CHECK (
  is_user_admin() AND user_id != auth.uid()
);

CREATE POLICY "Prevent user role self-modification" ON public.user_roles
FOR UPDATE USING (
  is_user_admin() AND user_id != auth.uid()
);

CREATE POLICY "Only admins can delete user roles" ON public.user_roles
FOR DELETE USING (is_user_admin());

-- Secure admin_roles table  
CREATE POLICY "Super admin role assignment only" ON public.admin_roles
FOR INSERT WITH CHECK (
  is_user_admin() AND 
  EXISTS(
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Phase 3: Fix security definer functions
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_user_moderator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('mod', 'admin')
  );
END;
$function$;

-- Phase 4: Add role change logging
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      'role_assigned',
      NEW.user_id,
      jsonb_build_object(
        'role', NEW.role,
        'assigned_by', auth.uid(),
        'table', TG_TABLE_NAME
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'role_removed',
      OLD.user_id,
      jsonb_build_object(
        'role', OLD.role,
        'removed_by', auth.uid(),
        'table', TG_TABLE_NAME
      )
    );
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Add role change triggers
CREATE TRIGGER role_change_audit_user_roles
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

CREATE TRIGGER role_change_audit_admin_roles
  AFTER INSERT OR DELETE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

-- Phase 5: Enhanced OTP security
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Delete expired OTPs (reduced to 3 minutes)
  DELETE FROM public.otp_verifications 
  WHERE expires_at < now() - interval '3 minutes'
    AND verified_at IS NULL;
    
  -- Delete old verified OTPs
  DELETE FROM public.otp_verifications 
  WHERE verified_at IS NOT NULL 
    AND verified_at < now() - interval '30 minutes';
    
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

-- Phase 6: Add admin action logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type text,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NOT is_user_admin() THEN
    RAISE EXCEPTION 'Unauthorized admin action logging attempt';
  END IF;
  
  PERFORM log_security_event(
    p_action_type,
    auth.uid(),
    jsonb_build_object(
      'admin_id', auth.uid(),
      'target_user_id', p_target_user_id,
      'action_details', p_details,
      'timestamp', now()
    )
  );
END;
$function$;