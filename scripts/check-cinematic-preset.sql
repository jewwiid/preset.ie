-- Check if preset 454bb50a-9a13-48a8-bce6-c0f26bbf0a4d is cinematic or regular

-- 1. Check in regular presets table
SELECT
    'REGULAR PRESET' as table_name,
    id,
    name,
    user_id,
    category,
    is_public,
    usage_count,
    created_at
FROM presets
WHERE id = '454bb50a-9a13-48a8-bce6-c0f26bbf0a4d';

-- 2. Check in cinematic_presets table
SELECT
    'CINEMATIC PRESET' as table_name,
    id,
    name,
    display_name,
    category,
    'System (No user_id column)' as user_info,
    is_active,
    created_at
FROM cinematic_presets
WHERE id = '454bb50a-9a13-48a8-bce6-c0f26bbf0a4d';

-- 3. Show verdict
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM cinematic_presets WHERE id = '454bb50a-9a13-48a8-bce6-c0f26bbf0a4d')
        THEN '✅ This is a CINEMATIC preset - showing "System" / "@preset" is CORRECT'
        WHEN EXISTS (SELECT 1 FROM presets WHERE id = '454bb50a-9a13-48a8-bce6-c0f26bbf0a4d')
        THEN '⚠️  This is a REGULAR preset - should show creator name, not System'
        ELSE '❌ Preset not found in either table'
    END as verdict;

-- 4. List all cinematic presets for reference
SELECT
    'All Cinematic Presets:' as info,
    COUNT(*) as total
FROM cinematic_presets;

SELECT
    id,
    name,
    display_name,
    category,
    sort_order,
    created_at
FROM cinematic_presets
ORDER BY sort_order
LIMIT 10;
