-- Create a safe user deletion function that handles the proper order
-- This avoids the 500 error by deleting in the correct sequence

CREATE OR REPLACE FUNCTION admin_delete_user(user_id_to_delete UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  step_result TEXT;
BEGIN
  -- Step 1: Delete from users_profile (will cascade to related tables)
  DELETE FROM public.users_profile WHERE user_id = user_id_to_delete;
  step_result := 'Deleted users_profile';

  -- Step 2: Delete from public.users if it exists (skip if table doesn't exist)
  BEGIN
    DELETE FROM public.users WHERE id = user_id_to_delete;
    step_result := step_result || ', deleted public.users';
  EXCEPTION
    WHEN undefined_table THEN
      step_result := step_result || ', skipped public.users (does not exist)';
  END;

  -- Step 3: Delete from auth.identities (OAuth connections)
  DELETE FROM auth.identities WHERE user_id = user_id_to_delete;
  step_result := step_result || ', deleted auth.identities';

  -- Step 4: Delete from auth.users (main auth record)
  DELETE FROM auth.users WHERE id = user_id_to_delete;
  step_result := step_result || ', deleted auth.users';

  result := jsonb_build_object(
    'success', true,
    'user_id', user_id_to_delete,
    'steps_completed', step_result
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    result := jsonb_build_object(
      'success', false,
      'user_id', user_id_to_delete,
      'error', SQLERRM,
      'detail', SQLSTATE,
      'last_step', step_result
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO service_role;

-- Usage example (commented out):
-- SELECT admin_delete_user('9a1a0b5e-fb83-42d0-bede-80795c4794b8');
