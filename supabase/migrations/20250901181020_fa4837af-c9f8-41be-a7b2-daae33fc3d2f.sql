-- Fix RLS warnings by adding missing policies and fixing security issues

-- 1. Add missing RLS policies for tables that have RLS enabled but no policies
DO $$
DECLARE
    table_record RECORD;
    policy_count INTEGER;
BEGIN
    -- Check each table with RLS enabled for missing policies
    FOR table_record IN 
        SELECT c.relname as tablename
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND c.relrowsecurity = true
        AND c.relname NOT LIKE 'pg_%'
        AND c.relname NOT LIKE 'sql_%'
    LOOP
        -- Count existing policies for this table
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_record.tablename;
        
        -- If no policies exist, add restrictive default policy
        IF policy_count = 0 THEN
            RAISE NOTICE 'Adding default policy for table: %', table_record.tablename;
            
            -- Add restrictive policy that blocks access by default
            EXECUTE format('CREATE POLICY "Default restrictive policy" ON public.%I FOR ALL USING (false)', table_record.tablename);
        END IF;
    END LOOP;
END $$;

-- 2. Fix specific tables that need proper policies (only if they don't already exist)

-- Lobby sessions - add policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lobby_sessions' AND policyname = 'Public read access') THEN
        DROP POLICY IF EXISTS "Default restrictive policy" ON public.lobby_sessions;
        CREATE POLICY "Public read access" ON public.lobby_sessions FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lobby_sessions' AND policyname = 'Service can manage lobby sessions') THEN
        CREATE POLICY "Service can manage lobby sessions" ON public.lobby_sessions FOR ALL USING (true);
    END IF;
END $$;

-- Tournament templates - add policies if they don't exist
DO $$
BEGIN
    -- Check if tournament_templates table exists and has RLS enabled
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
               WHERE n.nspname = 'public' AND c.relname = 'tournament_templates' AND c.relrowsecurity = true) THEN
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tournament_templates' AND policyname = 'Public read access') THEN
            DROP POLICY IF EXISTS "Default restrictive policy" ON public.tournament_templates;
            CREATE POLICY "Public read access" ON public.tournament_templates FOR SELECT USING (is_active = true);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tournament_templates' AND policyname = 'Admins can manage tournament templates') THEN
            CREATE POLICY "Admins can manage tournament templates" ON public.tournament_templates FOR ALL USING (is_user_admin());
        END IF;
    END IF;
END $$;

-- 3. Recreate critical functions with proper search_path

-- Update the is_user_admin function to have proper search_path if it exists
DROP FUNCTION IF EXISTS public.is_user_admin();
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$;