-- Create required tables for atomic market engine

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    entry_fee NUMERIC NOT NULL DEFAULT 0,
    total_pot NUMERIC NOT NULL DEFAULT 0,
    max_participants INTEGER NOT NULL DEFAULT 2,
    status TEXT NOT NULL DEFAULT 'open',
    created_by UUID NOT NULL,
    match_type TEXT DEFAULT 'standard',
    crash_reason TEXT,
    crashed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create match_queue table
CREATE TABLE IF NOT EXISTS match_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    player_id UUID NOT NULL,
    entry_fee NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'joined',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 minutes'),
    queue_status TEXT DEFAULT 'searching'
);

-- Enable RLS on new tables
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for matches
CREATE POLICY "Matches are viewable by everyone" 
ON matches FOR SELECT 
USING (true);

CREATE POLICY "Users can create matches" 
ON matches FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their matches" 
ON matches FOR UPDATE 
USING (auth.uid() = created_by);

-- Create RLS policies for match_queue
CREATE POLICY "Queue entries viewable by participants" 
ON match_queue FOR SELECT 
USING (
    player_id = auth.uid() OR 
    match_id IN (SELECT id FROM matches WHERE created_by = auth.uid())
);

CREATE POLICY "Users can join match queue" 
ON match_queue FOR INSERT 
WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their queue status" 
ON match_queue FOR UPDATE 
USING (auth.uid() = player_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by);
CREATE INDEX IF NOT EXISTS idx_match_queue_match_id ON match_queue(match_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_player_id ON match_queue(player_id);
CREATE INDEX IF NOT EXISTS idx_match_queue_status ON match_queue(status);