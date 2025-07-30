-- Add Xbox profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xbox_gamertag TEXT,
ADD COLUMN IF NOT EXISTS xbox_xuid TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS xbox_profile_picture TEXT,
ADD COLUMN IF NOT EXISTS xbox_gamer_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS xbox_linked_at TIMESTAMP WITH TIME ZONE;

-- Create index for Xbox lookups
CREATE INDEX IF NOT EXISTS idx_profiles_xbox_xuid ON public.profiles(xbox_xuid);
CREATE INDEX IF NOT EXISTS idx_profiles_xbox_gamertag ON public.profiles(xbox_gamertag);