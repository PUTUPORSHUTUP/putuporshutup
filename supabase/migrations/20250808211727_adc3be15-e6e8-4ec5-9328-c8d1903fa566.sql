-- Fix remaining functions without proper search_path

-- Fix get_auth_context function
CREATE OR REPLACE FUNCTION public.get_auth_context()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  role_name TEXT;
  claims JSON;
BEGIN
  BEGIN
    role_name := current_setting('request.jwt.claims', true)::json->>'role';
    claims := current_setting('request.jwt.claims', true)::json;
    RETURN json_build_object('role', role_name, 'claims', claims);
  EXCEPTION WHEN others THEN
    RETURN json_build_object('error', SQLERRM);
  END;
END;
$$;

-- Fix is_service_role function
CREATE OR REPLACE FUNCTION public.is_service_role()
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role',
    false
  );
$$;

-- Fix log_function_error function
CREATE OR REPLACE FUNCTION public.log_function_error(function_name text, error_code integer DEFAULT NULL::integer, error_message text DEFAULT NULL::text, request_headers jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  INSERT INTO function_errors (function_name, error_code, error_message, request_headers)
  VALUES (function_name, error_code, error_message, request_headers);
$$;

-- Fix manage_test_users function
CREATE OR REPLACE FUNCTION public.manage_test_users(action text, username text DEFAULT NULL::text, wallet_balance numeric DEFAULT 1000)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF action = 'list' THEN
    RETURN (SELECT json_agg(json_build_object(
      'id', user_id, 
      'username', username,
      'wallet_balance', wallet_balance,
      'is_test_account', is_test_account
    )) FROM profiles WHERE is_test_account = true);
    
  ELSIF action = 'reset' THEN
    UPDATE profiles 
    SET wallet_balance = 1000,
        updated_at = now()
    WHERE is_test_account = true;
    RETURN json_build_object('reset_count', (SELECT COUNT(*) FROM profiles WHERE is_test_account = true));
    
  ELSIF action = 'count' THEN
    RETURN json_build_object('test_user_count', (SELECT COUNT(*) FROM profiles WHERE is_test_account = true));
    
  ELSE
    RAISE EXCEPTION 'Invalid action: %. Valid actions: list, reset, count', action;
  END IF;
END;
$$;