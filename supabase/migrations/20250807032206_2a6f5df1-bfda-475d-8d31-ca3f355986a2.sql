-- Create posters table
CREATE TABLE IF NOT EXISTS public.posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT,
  tournament_url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;

-- Create policies for posters
CREATE POLICY "Posters are viewable by everyone" 
ON public.posters 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage all posters" 
ON public.posters 
FOR ALL 
USING (is_user_admin());

-- Add updated_at column and trigger
ALTER TABLE public.posters ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE TRIGGER update_posters_updated_at
BEFORE UPDATE ON public.posters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();