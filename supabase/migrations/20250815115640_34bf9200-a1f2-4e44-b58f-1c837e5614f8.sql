-- Create the rotation pointer if it doesn't exist
INSERT INTO public.match_cycle_state (id, idx, last_created)
VALUES (1, 0, now())
ON CONFLICT (id) DO NOTHING;