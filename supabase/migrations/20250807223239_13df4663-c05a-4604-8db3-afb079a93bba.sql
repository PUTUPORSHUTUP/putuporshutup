-- Create join_queue RPC function for quick lobby filling
CREATE OR REPLACE FUNCTION join_queue(
  player_id uuid,
  game_name text,
  game_mode text,
  entry_fee numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  queue_id uuid;
  target_game_id uuid;
BEGIN
  -- Get game ID by name
  SELECT id INTO target_game_id 
  FROM games 
  WHERE name = game_name OR display_name ILIKE '%' || game_name || '%'
  LIMIT 1;
  
  IF target_game_id IS NULL THEN
    RAISE EXCEPTION 'Game not found: %', game_name;
  END IF;
  
  -- Insert into match queue
  INSERT INTO match_queue (
    user_id,
    game_id,
    platform,
    stake_amount,
    queue_status,
    expires_at
  ) VALUES (
    player_id,
    target_game_id,
    'Xbox', -- Default platform
    entry_fee,
    'searching',
    now() + interval '30 minutes'
  )
  RETURNING id INTO queue_id;
  
  RETURN queue_id;
END;
$$;

-- Fill lobby with 8 test players
SELECT join_queue('00000000-0000-0000-0000-000000000001', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000002', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000003', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000004', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000005', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000006', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000007', 'cod_bo6', 'Multiplayer', 5);
SELECT join_queue('00000000-0000-0000-0000-000000000008', 'cod_bo6', 'Multiplayer', 5);