-- Add instructions column to game_matrix table
ALTER TABLE public.game_matrix 
ADD COLUMN setup_instructions text;

-- Add some sample instructions for popular games
UPDATE public.game_matrix 
SET setup_instructions = 'Create a Custom Lobby in Fortnite:
1. Go to Creative Mode
2. Select "Create" 
3. Choose "Island Code" and enter: PUOSU343
4. Set match type to "Battle Royale"
5. Configure player limit based on tournament size
6. Share lobby code with participants
7. Start match when all players ready'
WHERE game ILIKE '%fortnite%';

UPDATE public.game_matrix 
SET setup_instructions = 'Create a Custom Match in Call of Duty:
1. Go to Private Match
2. Select map and game mode
3. Configure match settings (time limit, score limit)
4. Set lobby to "Open" or share invite codes
5. Wait for all participants to join
6. Start match and screenshot final scoreboard for proof'
WHERE game ILIKE '%call of duty%' OR game ILIKE '%cod%';

UPDATE public.game_matrix 
SET setup_instructions = 'Create a Custom Game in Apex Legends:
1. Go to Firing Range with friends
2. Or coordinate drop location in Battle Royale
3. Use party invite system for team challenges
4. Screenshot placement and kill counts for verification
5. Submit proof within 30 minutes of match completion'
WHERE game ILIKE '%apex%';

-- Add default instructions for games without specific ones
UPDATE public.game_matrix 
SET setup_instructions = 'General Setup Instructions:
1. Create or join game lobby/match
2. Configure settings based on challenge type
3. Ensure all participants are present
4. Take screenshots of setup and final results
5. Submit proof according to platform verification method
6. Report results within 1 hour of completion'
WHERE setup_instructions IS NULL;