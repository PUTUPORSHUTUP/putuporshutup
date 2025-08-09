-- Seed the first wave of games and modes
insert into game_registry (game_key, display_name, enabled) values
  ('COD6','Call of Duty 6', true),
  ('APEX','Apex Legends',   false),
  ('RL',  'Rocket League',  false),
  ('FN',  'Fortnite',       false)
on conflict (game_key) do nothing;

insert into game_modes (mode_key, game_key, display_name, min_players, max_players, enabled) values
  ('COD6:KILL_RACE','COD6','Kill Race (Solo)', 2, 2, true),
  ('COD6:TDM',      'COD6','Team Deathmatch',  4, 12, false),
  ('APEX:BR_TRIOS', 'APEX','BR Trios',         6, 60, false),
  ('RL:DUELS',      'RL',  '1v1',              2, 2,  false),
  ('RL:DUOS',       'RL',  '2v2',              4, 4,  false),
  ('FN:SOLO',       'FN',  'Solo',             2, 100, false)
on conflict (mode_key) do nothing;