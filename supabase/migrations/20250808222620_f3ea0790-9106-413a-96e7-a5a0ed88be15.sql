-- Replace db_market_run() with a hardened version
create or replace function db_market_run()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started_at timestamptz := now();
  v_result jsonb := '{}'::jsonb;
begin
  -- BEGIN ATOMIC BLOCK
  perform pg_advisory_xact_lock(42);  -- prevents overlap runs in same tx

  -- >>>> YOUR EXISTING ENGINE LOGIC HERE <<<<
  -- Example skeleton:
  -- 1) pair players
  -- 2) create challenge
  -- 3) generate results
  -- 4) call db_market_payout_safe(match_id, pot_cents)

  -- For demo, return a success:
  v_result := jsonb_build_object(
    'ok', true,
    'message', 'market_completed',
    'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
  );
  return v_result;

exception
  when others then
    -- Always return *why* it failed
    return jsonb_build_object(
      'ok', false,
      'reason', sqlstate || ':' || replace(coalesce(sqlerrm,'(no message)'), chr(10), ' '),
      'duration_ms', (extract(epoch from (now() - v_started_at))*1000)::int
    );
end
$$;

-- Permissions so the UI can call it
revoke all on function db_market_run() from public;
grant execute on function db_market_run() to anon, authenticated, service_role;