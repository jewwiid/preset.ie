-- Fix cinematic preset creators to use existing admin user
-- This migration addresses the issue where cinematic presets show "System" instead of a proper creator

-- ==============================================
-- STEP 1: Update cinematic presets to use existing admin user
-- ==============================================

-- Use the existing Preset Admin user: c231dca2-2973-46f6-98ba-a20c51d71b69
UPDATE cinematic_presets 
SET user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE user_id IS NULL;

-- Show how many presets were updated
SELECT 
    COUNT(*) as total_cinematic_presets,
    COUNT(CASE WHEN user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69' THEN 1 END) as presets_now_using_admin,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as presets_still_null
FROM cinematic_presets;

-- ==============================================
-- STEP 2: Verify the fix
-- ==============================================

-- Show the updated cinematic presets with their creator info
SELECT 
    cp.id,
    cp.name,
    cp.display_name,
    cp.user_id,
    up.display_name as creator_name,
    up.handle as creator_handle,
    CASE 
        WHEN cp.user_id IS NOT NULL THEN 'Fixed - Shows proper creator'
        ELSE 'Still NULL - Will show System'
    END as creator_status
FROM cinematic_presets cp
LEFT JOIN users_profile up ON cp.user_id = up.user_id
ORDER BY cp.sort_order;

-- ==============================================
-- STEP 3: Show summary
-- ==============================================

SELECT 
    'Migration Summary' as status,
    COUNT(*) as total_cinematic_presets,
    COUNT(user_id) as presets_with_user_id,
    COUNT(*) - COUNT(user_id) as presets_with_null_user_id
FROM cinematic_presets;

-- ==============================================
-- Migration completed successfully
-- ==============================================
