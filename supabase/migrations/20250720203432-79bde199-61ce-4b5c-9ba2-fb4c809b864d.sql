-- Fix the foreign key relationship between wagers and profiles
-- The error shows wagers.creator_id needs to reference profiles, not auth.users directly

-- First, let's add the foreign key constraint properly
ALTER TABLE public.wagers 
ADD CONSTRAINT wagers_creator_id_fkey 
FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also add foreign key for wager_participants
ALTER TABLE public.wager_participants 
ADD CONSTRAINT wager_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.wager_participants 
ADD CONSTRAINT wager_participants_wager_id_fkey 
FOREIGN KEY (wager_id) REFERENCES public.wagers(id) ON DELETE CASCADE;

-- Add foreign key for games in wagers
ALTER TABLE public.wagers 
ADD CONSTRAINT wagers_game_id_fkey 
FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;