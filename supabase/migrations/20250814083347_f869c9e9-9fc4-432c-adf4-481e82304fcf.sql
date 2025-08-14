-- Step 1: Initialize match_cycle_state
INSERT INTO match_cycle_state (id, idx, last_created)
VALUES (1, 0, now())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add service role insert policy for match_queue (corrected)
CREATE POLICY "service_insert_match_queue"
ON match_queue
FOR INSERT
TO service_role
WITH CHECK (true);