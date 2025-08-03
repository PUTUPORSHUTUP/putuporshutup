-- Create posters table for dynamic poster management
CREATE TABLE public.posters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER DEFAULT 0,
  event_type TEXT DEFAULT 'sunday_showdown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;

-- Policies for poster management
CREATE POLICY "Everyone can view active posters" 
ON public.posters 
FOR SELECT 
USING (is_active = true AND is_archived = false);

CREATE POLICY "Admins can manage all posters" 
ON public.posters 
FOR ALL 
USING (is_user_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_posters_updated_at
BEFORE UPDATE ON public.posters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert current posters
INSERT INTO public.posters (title, image_url, event_type, display_order) VALUES
('Sunday Showdown Current', '/lovable-uploads/4e3b5b2c-0ba4-4d1b-988c-245b68239da1.png', 'sunday_showdown', 1),
('Tournament Elite', '/lovable-uploads/tournament-poster-elite-001.jpg', 'tournament', 2),
('Tournament Masters', '/lovable-uploads/tournament-poster-masters-001.jpg', 'tournament', 3),
('Tournament Pro', '/lovable-uploads/tournament-poster-pro-001.jpg', 'tournament', 4);