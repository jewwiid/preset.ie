-- Check user c231dca2-2973-46f6-98ba-a20c51d71b69

-- 1. Check auth.users
SELECT
    'auth.users' as table_name,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
WHERE id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 2. Check users_profile by user_id (this is what the API now uses)
SELECT
    'users_profile (by user_id)' as table_name,
    id as profile_id,
    user_id,
    display_name,
    handle,
    first_name,
    last_name,
    avatar_url,
    created_at
FROM users_profile
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 3. Check if there are any presets by this user
SELECT
    'presets by this user' as check_type,
    id as preset_id,
    name,
    user_id,
    is_public,
    created_at
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
ORDER BY created_at DESC;

-- 4. Check if profile exists with ID matching the user_id (old buggy way)
SELECT
    'users_profile (by id - OLD BUGGY WAY)' as table_name,
    id as profile_id,
    user_id,
    display_name,
    handle,
    created_at
FROM users_profile
WHERE id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 5. Summary: Is there a profile?
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM users_profile
            WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
        ) THEN '✅ Profile EXISTS for this user'
        WHEN EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
        ) THEN '⚠️  User exists but NO PROFILE - needs to be created!'
        ELSE '❌ User does NOT exist in auth.users'
    END as status;
