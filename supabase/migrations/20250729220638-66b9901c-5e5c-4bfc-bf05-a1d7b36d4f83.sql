-- Create a function to safely call nextval
CREATE OR REPLACE FUNCTION public.safe_nextval(sequence_name text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN nextval(sequence_name);
END;
$$;