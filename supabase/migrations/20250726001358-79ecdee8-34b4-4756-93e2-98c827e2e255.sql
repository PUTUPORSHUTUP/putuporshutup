-- Create user_roles table with role hierarchy
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'mod', 'player')),
  assigned_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (is_user_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create flagged_matches table for moderator workflow
CREATE TABLE public.flagged_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wager_id UUID,
  tournament_match_id UUID,
  flagged_by UUID NOT NULL,
  flag_reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  mod_notes TEXT,
  mod_recommendation TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flagged_matches
ALTER TABLE public.flagged_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for flagged_matches
CREATE POLICY "Mods and admins can view flagged matches" 
ON public.flagged_matches 
FOR SELECT 
USING (
  is_user_admin() OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('mod', 'admin'))
);

CREATE POLICY "Mods and admins can update flagged matches" 
ON public.flagged_matches 
FOR UPDATE 
USING (
  is_user_admin() OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('mod', 'admin'))
);

CREATE POLICY "Users can create flagged matches" 
ON public.flagged_matches 
FOR INSERT 
WITH CHECK (auth.uid() = flagged_by);

-- Create moderator-specific functions
CREATE OR REPLACE FUNCTION public.is_user_moderator(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_uuid AND role IN ('mod', 'admin')
  );
END;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role 
  FROM public.user_roles 
  WHERE user_id = user_uuid 
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'mod' THEN 2 
      WHEN 'player' THEN 3 
    END 
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'player');
END;
$$;

-- Create trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on flagged_matches
CREATE TRIGGER update_flagged_matches_updated_at
  BEFORE UPDATE ON public.flagged_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin role for existing admin users
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT user_id, 'admin', user_id
FROM public.admin_roles
ON CONFLICT (user_id, role) DO NOTHING;