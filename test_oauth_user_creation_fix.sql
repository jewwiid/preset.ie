-- Test OAuth User Creation Fix
-- Run this AFTER applying the fix to verify it works

-- Check that the trigger is active
SELECT 'Checking trigger status...' as test;
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
  AND t.tgname = 'on_auth_user_created_fixed';

-- Simulate what happens during OAuth (manual test)
-- NOTE: Only run this if you want to create a test user
-- Uncomment the lines below to test:

/*
-- Create a test auth user (simulating Google OAuth)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test-oauth-fix@example.com',
  '',
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "google", "providers": ["google"]}',
  '{"full_name": "Test OAuth User", "avatar_url": "https://example.com/avatar.jpg"}',
  false,
  '',
  '',
  '',
  ''
);

-- Check if profile was created
SELECT 'Profile creation test result:' as test;
SELECT 
  up.user_id,
  up.display_name,
  up.handle,
  up.role_flags,
  up.subscription_tier
FROM users_profile up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'test-oauth-fix@example.com';

-- Clean up test data
DELETE FROM auth.users WHERE email = 'test-oauth-fix@example.com';
*/

SELECT '✅ Test script ready. Uncomment the test section to run a manual test.' as result;
