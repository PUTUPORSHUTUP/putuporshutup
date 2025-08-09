-- Enable RLS on the new tables (if not already enabled)
ALTER TABLE public.game_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_modes ENABLE ROW LEVEL SECURITY;