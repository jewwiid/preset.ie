-- Quick check to see what's wrong with the trigger

-- Check if our new trigger exists
SELECT 'Current triggers on auth.users:' as status;
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'DISABLED' 
    WHEN 'D' THEN 'DISABLED' 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'UNKNOWN' 
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
ORDER BY t.tgname;

-- Check if our function exists
SELECT 'Function exists check:' as status;
SELECT EXISTS(
  SELECT 1 FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'handle_oauth_user_creation'
) as function_exists;

-- Check users_profile table constraints
SELECT 'users_profile constraints:' as status;
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'users_profile' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, tc.constraint_name;
