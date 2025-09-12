-- Check if Marcus Chen (@marcus_model) exists and get login info
-- Run this in Supabase Dashboard to see if we have the test user

-- 1. Check if Marcus exists in profiles
SELECT 
    up.id as profile_id,
    up.display_name, 
    up.handle, 
    up.user_id as auth_user_id,
    up.role_flags,
    up.created_at
FROM users_profile up
WHERE up.handle = 'marcus_model' OR up.display_name ILIKE '%marcus%';

-- 2. Check auth users table for any Marcus accounts
SELECT 
    au.id as auth_id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.phone,
    au.confirmation_token IS NOT NULL as has_confirmation_token
FROM auth.users au
WHERE au.email ILIKE '%marcus%' 
   OR au.raw_user_meta_data->>'display_name' ILIKE '%marcus%'
   OR au.raw_user_meta_data->>'handle' ILIKE '%marcus%';

-- 3. If Marcus doesn't exist, show how to create test user
-- You'll need to either:
-- a) Sign up normally at /signup with email: marcus@test.com, password: testpassword123
-- b) Or use an existing admin account for testing

-- 4. Check current verification requests to see if any exist
SELECT 
    vr.id,
    vr.request_type,
    vr.status,
    vr.submitted_at,
    up.display_name,
    up.handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.id
ORDER BY vr.submitted_at DESC
LIMIT 5;

-- 5. If you want to create Marcus manually (not recommended for production):
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (gen_random_uuid(), 'marcus@test.com', crypt('testpassword123', gen_salt('bf')), NOW(), NOW(), NOW());
-- (Don't run this - use normal signup flow instead)