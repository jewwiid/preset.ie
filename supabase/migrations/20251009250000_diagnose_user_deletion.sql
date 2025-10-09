-- Diagnostic script to find what's blocking user deletion
-- Run this to identify the exact cause of the 500 error

-- 1. Check all triggers on auth.users
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- 2. Check all foreign keys referencing auth.users (not from public schema)
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.referential_constraints rc
JOIN information_schema.table_constraints tc
  ON rc.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
  AND tc.table_schema != 'public'
ORDER BY tc.table_schema, tc.table_name;

-- 3. Attempt test deletion with detailed error output
DO $$
DECLARE
  test_user_id uuid;
  error_detail text;
BEGIN
  -- Find the problematic user
  test_user_id := '9a1a0b5e-fb83-42d0-bede-80795c4794b8';

  -- Try to delete and capture error
  BEGIN
    DELETE FROM auth.users WHERE id = test_user_id;
    RAISE NOTICE 'User deleted successfully';
  EXCEPTION
    WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS error_detail = PG_EXCEPTION_DETAIL;
      RAISE WARNING 'Delete failed: % | Detail: %', SQLERRM, error_detail;
  END;
END $$;
