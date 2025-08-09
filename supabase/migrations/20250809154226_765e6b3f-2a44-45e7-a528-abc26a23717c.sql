-- 1) Game registry
create table if not exists game_registry (
  game_key text primary key,          -- e.g. 'COD6', 'APEX', 'RL', 'FORTNITE'
  display_name text not null,
  enabled boolean not null default false
);

create table if not exists game_modes (
  mode_key text primary key,          -- e.g. 'COD6:KILL_RACE'
  game_key text not null references game_registry(game_key) on delete cascade,
  display_name text not null,
  min_players int not null default 2,
  max_players int not null default 2,
  enabled boolean not null default false
);

-- 2) Wire queues/matches to official keys
alter table match_queue  add column if not exists game_mode_key text;
alter table matches      add column if not exists game_mode_key text;