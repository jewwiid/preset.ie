-- Username Login Support - RPC Function
-- Allows users to sign in with their username/handle

-- Create a secure function to resolve username to email for authentication
CREATE OR REPLACE FUNCTION resolve_username_to_email(username_input text)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_email text;
  cleaned_username text;
BEGIN
  -- Clean the input: remove @ prefix if present, convert to lowercase, trim whitespace
  cleaned_username := lower(trim(both '@' from trim(username_input)));
  
  -- Validate input
  IF cleaned_username = '' OR cleaned_username IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up email by handle in users_profile
  SELECT au.email INTO user_email
  FROM auth.users au
  JOIN users_profile up ON au.id = up.user_id
  WHERE up.handle = cleaned_username
    AND au.email_confirmed_at IS NOT NULL  -- Only confirmed users
    AND up.created_at IS NOT NULL;        -- Profile exists
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION resolve_username_to_email(text) TO authenticated;

-- Add some helpful comments
COMMENT ON FUNCTION resolve_username_to_email(text) IS 'Securely resolves a username/handle to an email address for authentication. Returns NULL if username not found or user not confirmed.';

-- Test the function (this will return NULL if no users exist yet)
DO $$
BEGIN
  -- Test with a non-existent username
  IF resolve_username_to_email('nonexistent') IS NULL THEN
    RAISE NOTICE '✅ Username resolution function created successfully';
  END IF;
END $$;