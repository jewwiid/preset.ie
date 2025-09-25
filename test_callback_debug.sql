-- Test callback debug - Check if the user profile exists and is accessible
-- This will help debug why the callback page is stuck

-- Check if the user exists in auth.users
SELECT id, email, created_at, raw_user_meta_data->>'full_name' as full_name
FROM auth.users 
WHERE email = 'yjnationtv@gmail.com';

-- Check if the user profile exists
SELECT user_id, display_name, handle, created_at
FROM public.users_profile 
WHERE user_id = 'c3dc2f39-6f7b-4c72-b140-e2ffccb9fe8e';

-- Check if the user record exists in public.users
SELECT id, email, role, created_at
FROM public.users 
WHERE id = 'c3dc2f39-6f7b-4c72-b140-e2ffccb9fe8e';

-- Test the exact query the callback page uses
SELECT *
FROM public.users_profile 
WHERE user_id = 'c3dc2f39-6f7b-4c72-b140-e2ffccb9fe8e';

-- Check if there are any RLS policies blocking the query
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users_profile';

-- Show success message
SELECT 'Debug check completed - all queries should return results' as status;
