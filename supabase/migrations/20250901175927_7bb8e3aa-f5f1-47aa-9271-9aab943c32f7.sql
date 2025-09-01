-- Fix RLS security issue by enabling RLS on any tables that don't have it
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Enable RLS on all public tables that don't have it enabled
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND NOT EXISTS (
            SELECT 1 FROM pg_class c 
            JOIN pg_namespace n ON c.relnamespace = n.oid 
            WHERE c.relname = pg_tables.tablename 
            AND n.nspname = 'public' 
            AND c.relrowsecurity = true
        )
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
        
        -- Add a basic select policy for public tables that should be readable
        IF table_record.tablename IN ('lobby_sessions', 'games', 'game_matrix', 'tournaments') THEN
            EXECUTE format('DROP POLICY IF EXISTS "Public read access" ON public.%I', table_record.tablename);
            EXECUTE format('CREATE POLICY "Public read access" ON public.%I FOR SELECT USING (true)', table_record.tablename);
        END IF;
    END LOOP;
END $$;