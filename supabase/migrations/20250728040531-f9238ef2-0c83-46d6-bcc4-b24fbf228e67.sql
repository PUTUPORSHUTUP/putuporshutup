-- Clear existing sponsor logos and add fictitious ones
DELETE FROM public.sponsor_logos;

-- Insert fictitious gaming sponsor logos
INSERT INTO public.sponsor_logos (name, logo_url) VALUES
  ('NeonStrike Gaming', 'https://images.unsplash.com/photo-1614680376573-df3480f27355?w=320&h=160&fit=crop&crop=center'),
  ('VoltEdge Pro', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=320&h=160&fit=crop&crop=center'),
  ('CyberForge Labs', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=320&h=160&fit=crop&crop=center'),
  ('QuantumPlay', 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=320&h=160&fit=crop&crop=center'),
  ('ThunderBolt Gaming', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=320&h=160&fit=crop&crop=center'),
  ('EliteStorm Gear', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=320&h=160&fit=crop&crop=center');