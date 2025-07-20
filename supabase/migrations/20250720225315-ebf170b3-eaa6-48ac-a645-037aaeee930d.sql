-- Create admin roles table
CREATE TABLE public.admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin roles (only admins can manage admin roles)
CREATE POLICY "Admins can view admin roles" 
ON public.admin_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
  )
);

CREATE POLICY "Admins can manage admin roles" 
ON public.admin_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_roles ar 
    WHERE ar.user_id = auth.uid() AND ar.role = 'admin'
  )
);

-- Add is_admin flag to profiles for easy checking
ALTER TABLE public.profiles 
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update admin status in profiles
CREATE OR REPLACE FUNCTION public.update_admin_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update admin status
CREATE TRIGGER update_admin_status_trigger
AFTER INSERT OR DELETE ON public.admin_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_admin_status();

-- Create view for admin analytics
CREATE VIEW public.admin_analytics AS
SELECT 
  -- Revenue Analytics
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'deposit' AND status = 'completed') as total_deposits,
  (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'withdrawal' AND status = 'completed') as total_withdrawals,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_premium_users,
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM tournaments) as total_tournaments,
  (SELECT COUNT(*) FROM wagers) as total_wagers,
  
  -- Recent activity
  (SELECT COUNT(*) FROM transactions WHERE created_at > NOW() - INTERVAL '24 hours') as transactions_today,
  (SELECT COUNT(*) FROM tournaments WHERE created_at > NOW() - INTERVAL '7 days') as tournaments_this_week,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_this_week;