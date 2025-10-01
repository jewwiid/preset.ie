-- Debug why preset shows "Unknown" user
-- Check if the user exists and if there's a profile mismatch

-- 1. Check if the user exists in auth.users
SELECT
    'User in auth.users' as check_type,
    id,
    email,
    created_at
FROM auth.users
WHERE id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 2. Check if there's a profile in users_profile
SELECT
    'Profile by user_id' as check_type,
    id as profile_id,
    user_id,
    display_name,
    handle,
    avatar_url,
    created_at
FROM users_profile
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 3. Check if there's a profile with id matching the user_id
SELECT
    'Profile by id' as check_type,
    id as profile_id,
    user_id,
    display_name,
    handle,
    avatar_url,
    created_at
FROM users_profile
WHERE id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 4. Check which presets are associated with this user
SELECT
    'Presets by this user' as check_type,
    id as preset_id,
    name,
    user_id,
    created_at
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 5. Check the mismatch: presets.user_id vs users_profile
SELECT
    p.id as preset_id,
    p.name as preset_name,
    p.user_id as preset_user_id,
    up.id as profile_id,
    up.user_id as profile_user_id,
    up.display_name,
    CASE
        WHEN up.id IS NULL THEN '❌ No profile found with this id'
        WHEN up.display_name IS NULL THEN '⚠️  Profile exists but no display_name'
        ELSE '✅ Profile found'
    END as status
FROM presets p
LEFT JOIN users_profile up ON p.user_id = up.id
WHERE p.user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 6. Show the relationship structure
SELECT
    'Relationship check' as check_type,
    'presets.user_id should match users_profile.id (NOT users_profile.user_id)' as explanation;
