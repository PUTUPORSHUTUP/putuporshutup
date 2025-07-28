-- Create sponsor_logos table
CREATE TABLE public.sponsor_logos (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.sponsor_logos ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Sponsor logos are viewable by everyone" 
ON public.sponsor_logos 
FOR SELECT 
USING (is_active = true);

-- Insert sponsor logo data
INSERT INTO public.sponsor_logos (name, logo_url) VALUES
  ('GFuel', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/GFuel_Logo.png/320px-GFuel_Logo.png'),
  ('Red Bull Gaming', 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0d/Red_Bull_logo.svg/320px-Red_Bull_logo.svg.png'),
  ('Razer', 'https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Razer_logo.svg/320px-Razer_logo.svg.png'),
  ('Alienware', 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bc/Alienware_logo.svg/320px-Alienware_logo.svg.png'),
  ('SteelSeries', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/SteelSeries_logo.svg/320px-SteelSeries_logo.svg.png');