-- Check existing admin users to see if we should use an existing one instead of creating new

-- Check all users with ADMIN role
SELECT 
    up.id,
    up.user_id,
    up.display_name,
    up.handle,
    up.role_flags,
    au.email,
    au.created_at as user_created_at,
    up.created_at as profile_created_at
FROM users_profile up
JOIN auth.users au ON up.user_id = au.id
WHERE 'ADMIN'::user_role = ANY(up.role_flags)
ORDER BY up.created_at;

-- Check all users (to see the full picture)
SELECT 
    up.id,
    up.user_id,
    up.display_name,
    up.handle,
    up.role_flags,
    au.email,
    au.created_at as user_created_at
FROM users_profile up
JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at;

-- Check if there are any users with "preset" or "admin" in their name/handle
SELECT 
    up.id,
    up.user_id,
    up.display_name,
    up.handle,
    up.role_flags,
    au.email
FROM users_profile up
JOIN auth.users au ON up.user_id = au.id
WHERE 
    LOWER(up.display_name) LIKE '%preset%' OR 
    LOWER(up.handle) LIKE '%preset%' OR
    LOWER(up.display_name) LIKE '%admin%' OR 
    LOWER(up.handle) LIKE '%admin%' OR
    LOWER(au.email) LIKE '%admin%' OR
    LOWER(au.email) LIKE '%preset%'
ORDER BY up.created_at;
