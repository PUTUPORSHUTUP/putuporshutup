-- Create sponsors table to store sponsor applications
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  selected_tier TEXT NOT NULL CHECK (selected_tier IN ('Bronze', 'Silver', 'Gold')),
  tournament_preferences TEXT,
  budget_range TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Create policies - anyone can submit sponsor applications
CREATE POLICY "allow_sponsor_applications" ON public.sponsors
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view sponsor applications  
CREATE POLICY "admins_can_view_sponsors" ON public.sponsors
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Only admins can update sponsor status
CREATE POLICY "admins_can_update_sponsors" ON public.sponsors
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Add updated_at trigger
CREATE TRIGGER update_sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();