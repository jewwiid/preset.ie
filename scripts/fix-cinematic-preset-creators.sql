-- Fix cinematic preset creators to use a dedicated preset admin user
-- This script addresses the issue where cinematic presets show "System" instead of a proper creator

-- Step 1: Check current state of cinematic presets
SELECT 
    id, 
    name, 
    display_name, 
    user_id,
    CASE 
        WHEN user_id IS NULL THEN 'NULL - Shows as System'
        ELSE 'Has user_id - Shows actual creator'
    END as creator_status
FROM cinematic_presets 
ORDER BY sort_order;

-- Step 2: Check if there's already a preset admin user
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email LIKE '%preset%' OR email LIKE '%admin%' OR email LIKE '%system%'
ORDER BY created_at;

-- Step 3: Check users_profile for preset admin
SELECT 
    id,
    user_id,
    display_name,
    handle,
    role_flags
FROM users_profile 
WHERE display_name LIKE '%preset%' OR display_name LIKE '%admin%' OR display_name LIKE '%system%'
ORDER BY created_at;

-- Step 4: Create a dedicated preset admin user if it doesn't exist
-- Note: This will need to be run manually or through Supabase Auth API
-- For now, we'll just show what needs to be done

-- Step 5: Show what the update would look like (commented out for safety)
/*
UPDATE cinematic_presets 
SET user_id = 'REPLACE_WITH_PRESET_ADMIN_USER_ID'
WHERE user_id IS NULL;
*/

-- Step 6: Verify the fix would work
SELECT 
    'After fix, cinematic presets would show:' as status,
    COUNT(*) as total_cinematic_presets,
    COUNT(user_id) as presets_with_user_id,
    COUNT(*) - COUNT(user_id) as presets_with_null_user_id
FROM cinematic_presets;
