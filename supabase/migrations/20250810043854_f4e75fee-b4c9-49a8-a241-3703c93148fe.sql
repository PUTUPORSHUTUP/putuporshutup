-- TARGETED SECURITY FIXES - Only missing components
-- Enable RLS on tables that don't have it yet
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings_audit ENABLE ROW LEVEL SECURITY;

-- Add missing policies for matches table
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

-- Add missing policies for security_settings_audit
CREATE POLICY "Admins can view security audit" ON public.security_settings_audit  
FOR SELECT USING (is_user_admin());

CREATE POLICY "System can log security events" ON public.security_settings_audit
FOR INSERT WITH CHECK (true);

-- Add role escalation prevention for user_roles
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

-- Add role change logging
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

-- Add role change triggers if they don't exist
DROP TRIGGER IF EXISTS role_change_audit_user_roles ON public.user_roles;
CREATE TRIGGER role_change_audit_user_roles
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

DROP TRIGGER IF EXISTS role_change_audit_admin_roles ON public.admin_roles;
CREATE TRIGGER role_change_audit_admin_roles
  AFTER INSERT OR DELETE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

-- Enhanced admin action logging
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