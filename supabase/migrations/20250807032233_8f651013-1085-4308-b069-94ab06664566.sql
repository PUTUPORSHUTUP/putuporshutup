-- Create posters table
CREATE TABLE IF NOT EXISTS public.posters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT,
  tournament_url TEXT,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.posters ENABLE ROW LEVEL SECURITY;

-- Create policies for posters (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posters' AND policyname = 'Posters are viewable by everyone'
  ) THEN
    EXECUTE 'CREATE POLICY "Posters are viewable by everyone" ON public.posters FOR SELECT USING (true)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posters' AND policyname = 'Admins can manage all posters'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage all posters" ON public.posters FOR ALL USING (is_user_admin())';
  END IF;
END $$;

-- Create trigger for updated_at (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_posters_updated_at'
  ) THEN
    EXECUTE 'CREATE TRIGGER update_posters_updated_at BEFORE UPDATE ON public.posters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()';
  END IF;
END $$;