-- Check and fix RLS policies for tournaments table
-- Allow everyone to view tournaments
CREATE POLICY "Everyone can view tournaments" 
ON tournaments 
FOR SELECT 
USING (true);

-- Allow everyone to view tournament posters  
CREATE POLICY "Everyone can view tournament posters"
ON tournament_posters
FOR SELECT
USING (true);