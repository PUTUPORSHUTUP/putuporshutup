-- Fix search path security for safe_nextval function
CREATE OR REPLACE FUNCTION public.safe_nextval(sequence_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN nextval(sequence_name);
END;
$$;