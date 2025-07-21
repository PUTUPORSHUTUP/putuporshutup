-- Add more popular games to expand the game library
INSERT INTO public.games (name, display_name, description, platform, image_url) VALUES
('destiny-2', 'Destiny 2', 'MMO first-person shooter with RPG elements', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('rocket-league-new', 'Rocket League', 'Vehicular soccer video game', ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('rainbow-six-siege', 'Rainbow Six Siege', 'Tactical multiplayer FPS', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('street-fighter-6', 'Street Fighter 6', 'Fighting game with classic characters', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('tekken-8', 'Tekken 8', '3D fighting game with martial arts combat', ARRAY['PC', 'PlayStation', 'Xbox'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('mortal-kombat-1', 'Mortal Kombat 1', 'Brutal fighting game with finishing moves', ARRAY['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('gran-turismo-7', 'Gran Turismo 7', 'Racing simulation with realistic physics', ARRAY['PlayStation'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('forza-horizon-5', 'Forza Horizon 5', 'Open-world racing in Mexico', ARRAY['PC', 'Xbox'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('among-us', 'Among Us', 'Social deduction party game', ARRAY['PC', 'Mobile', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500'),
('genshin-impact', 'Genshin Impact', 'Open-world action RPG with gacha elements', ARRAY['PC', 'Mobile', 'PlayStation'], 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500');

-- Add comprehensive game modes for existing and new games
INSERT INTO public.game_modes (game_id, mode_name, mode_description, max_players) VALUES 
-- Fortnite modes
((SELECT id FROM games WHERE name = 'fortnite'), 'Solo', 'Single player battle royale', 1),
((SELECT id FROM games WHERE name = 'fortnite'), 'Duos', 'Two player team battle royale', 2),
((SELECT id FROM games WHERE name = 'fortnite'), 'Squads', 'Four player team battle royale', 4),
((SELECT id FROM games WHERE name = 'fortnite'), 'Creative', 'Building and custom games', 16),

-- Apex Legends modes
((SELECT id FROM games WHERE name = 'apex-legends'), 'Trios', 'Three player squad battle royale', 3),
((SELECT id FROM games WHERE name = 'apex-legends'), 'Duos', 'Two player team battle royale', 2),
((SELECT id FROM games WHERE name = 'apex-legends'), 'Ranked', 'Competitive ranked matches', 3),
((SELECT id FROM games WHERE name = 'apex-legends'), 'Arena', '3v3 round-based combat', 6),

-- Call of Duty Warzone modes  
((SELECT id FROM games WHERE name = 'call-of-duty-warzone'), 'Quads', 'Four player squad battle royale', 4),
((SELECT id FROM games WHERE name = 'call-of-duty-warzone'), 'Trios', 'Three player squad battle royale', 3),
((SELECT id FROM games WHERE name = 'call-of-duty-warzone'), 'Solos', 'Single player battle royale', 1),
((SELECT id FROM games WHERE name = 'call-of-duty-warzone'), 'Plunder', 'Money collection mode', 4),

-- Counter-Strike 2 modes
((SELECT id FROM games WHERE name = 'cs2'), 'Competitive', '5v5 ranked matches', 10),
((SELECT id FROM games WHERE name = 'cs2'), 'Casual', '5v5 casual matches', 10),
((SELECT id FROM games WHERE name = 'cs2'), 'Deathmatch', 'Free for all combat', 16),
((SELECT id FROM games WHERE name = 'cs2'), 'Arms Race', 'Gun progression mode', 16),

-- Valorant modes
((SELECT id FROM games WHERE name = 'valorant'), 'Competitive', '5v5 ranked matches with agent abilities', 10),
((SELECT id FROM games WHERE name = 'valorant'), 'Unrated', '5v5 casual matches', 10),
((SELECT id FROM games WHERE name = 'valorant'), 'Spike Rush', 'Quick 4v4 rounds', 8),
((SELECT id FROM games WHERE name = 'valorant'), 'Deathmatch', 'Free for all training', 10),

-- League of Legends modes
((SELECT id FROM games WHERE name = 'league-of-legends'), 'Ranked Solo/Duo', '5v5 competitive ranked', 10),
((SELECT id FROM games WHERE name = 'league-of-legends'), 'Normal Draft', '5v5 draft pick', 10),
((SELECT id FROM games WHERE name = 'league-of-legends'), 'ARAM', 'All Random All Mid on Howling Abyss', 10),
((SELECT id FROM games WHERE name = 'league-of-legends'), 'Teamfight Tactics', 'Auto chess strategy', 8),

-- Overwatch 2 modes
((SELECT id FROM games WHERE name = 'overwatch-2'), 'Competitive', '5v5 ranked matches', 10),
((SELECT id FROM games WHERE name = 'overwatch-2'), 'Quick Play', '5v5 casual matches', 10),
((SELECT id FROM games WHERE name = 'overwatch-2'), 'Arcade', 'Featured game modes', 12),
((SELECT id FROM games WHERE name = 'overwatch-2'), 'Mystery Heroes', 'Random hero selection', 12),

-- Rocket League modes  
((SELECT id FROM games WHERE name = 'rocket-league'), '1v1 Duel', 'Solo competitive', 2),
((SELECT id FROM games WHERE name = 'rocket-league'), '2v2 Doubles', 'Two player teams', 4),
((SELECT id FROM games WHERE name = 'rocket-league'), '3v3 Standard', 'Standard team mode', 6),
((SELECT id FROM games WHERE name = 'rocket-league'), 'Hoops', 'Basketball variant', 6),

-- FIFA/EA FC modes
((SELECT id FROM games WHERE name = 'fifa-24'), 'Ultimate Team', '11v11 with custom teams', 2),
((SELECT id FROM games WHERE name = 'fifa-24'), 'Seasons', 'Online head-to-head', 2),
((SELECT id FROM games WHERE name = 'fifa-24'), 'Pro Clubs', '11v11 with created players', 22),
((SELECT id FROM games WHERE name = 'fifa-24'), 'Volta Football', 'Street football', 10),

-- Add modes for new games
-- Rainbow Six Siege
((SELECT id FROM games WHERE name = 'rainbow-six-siege'), 'Ranked', '5v5 competitive bomb defusal', 10),
((SELECT id FROM games WHERE name = 'rainbow-six-siege'), 'Unranked', '5v5 casual bomb defusal', 10),
((SELECT id FROM games WHERE name = 'rainbow-six-siege'), 'Quick Match', 'Casual 5v5 various modes', 10),
((SELECT id FROM games WHERE name = 'rainbow-six-siege'), 'Terrorist Hunt', 'PvE co-op mode', 5),

-- Street Fighter 6
((SELECT id FROM games WHERE name = 'street-fighter-6'), 'Ranked Match', '1v1 competitive fighting', 2),
((SELECT id FROM games WHERE name = 'street-fighter-6'), 'Casual Match', '1v1 casual fighting', 2),
((SELECT id FROM games WHERE name = 'street-fighter-6'), 'Battle Hub', 'Social lobby matches', 2),
((SELECT id FROM games WHERE name = 'street-fighter-6'), 'World Tour', 'Single player story mode', 1),

-- Tekken 8
((SELECT id FROM games WHERE name = 'tekken-8'), 'Ranked Match', '1v1 competitive fighting', 2),
((SELECT id FROM games WHERE name = 'tekken-8'), 'Player Match', '1v1 casual fighting', 2),
((SELECT id FROM games WHERE name = 'tekken-8'), 'Tekken Ball', 'Beach volleyball variant', 4),
((SELECT id FROM games WHERE name = 'tekken-8'), 'Arcade Mode', 'Single player ladder', 1),

-- Destiny 2
((SELECT id FROM games WHERE name = 'destiny-2'), 'Trials of Osiris', '3v3 competitive PvP', 6),
((SELECT id FROM games WHERE name = 'destiny-2'), 'Survival', '3v3 elimination', 6),
((SELECT id FROM games WHERE name = 'destiny-2'), 'Control', '6v6 zone capture', 12),
((SELECT id FROM games WHERE name = 'destiny-2'), 'Raids', '6 player PvE endgame', 6);