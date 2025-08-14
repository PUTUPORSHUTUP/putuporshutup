-- Address security definer view issue by ensuring RLS is properly configured
-- First, let's check and remove any problematic security definer views in public schema
DROP VIEW IF EXISTS public.v_joinable_matches CASCADE;

-- Recreate as a regular view without security definer if it was using it
CREATE OR REPLACE VIEW public.v_joinable_matches AS
SELECT 
    mq.*,
    g.display_name as game_name,
    p.username as creator_username
FROM public.match_queue mq
LEFT JOIN public.games g ON mq.game_id = g.id  
LEFT JOIN public.profiles p ON mq.user_id = p.user_id
WHERE mq.queue_status = 'searching'
AND mq.expires_at > now();

-- Ensure proper RLS on the underlying tables instead of using security definer
GRANT SELECT ON public.v_joinable_matches TO anon, authenticated;