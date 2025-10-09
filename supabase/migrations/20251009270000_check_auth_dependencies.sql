-- Check what's in the auth schema that might be blocking deletion

-- 1. Check auth schema foreign keys
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'auth'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- 2. Check for any data related to the user
DO $$
DECLARE
  user_id_check text := '9a1a0b5e-fb83-42d0-bede-80795c4794b8';
BEGIN
  RAISE NOTICE 'Checking auth.sessions: %', (SELECT COUNT(*) FROM auth.sessions WHERE user_id::text = user_id_check);
  RAISE NOTICE 'Checking auth.refresh_tokens: %', (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id = user_id_check);
  RAISE NOTICE 'Checking auth.identities: %', (SELECT COUNT(*) FROM auth.identities WHERE user_id::text = user_id_check);
  RAISE NOTICE 'Checking public.users_profile: %', (SELECT COUNT(*) FROM public.users_profile WHERE user_id::text = user_id_check);
END $$;
