-- Identify if a preset is cinematic or regular
-- Usage: Replace the UUID with the preset ID you want to check

-- Set the preset ID here:
\set preset_id '454bb50a-9a13-48a8-bce6-c0f26bbf0a4d'

-- Check both tables
WITH preset_check AS (
    SELECT
        'regular' as type,
        id,
        name,
        user_id,
        category,
        is_public,
        created_at
    FROM presets
    WHERE id = :'preset_id'

    UNION ALL

    SELECT
        'cinematic' as type,
        id,
        display_name as name,
        NULL::uuid as user_id,
        category,
        is_active::boolean as is_public,
        created_at
    FROM cinematic_presets
    WHERE id = :'preset_id'
)
SELECT
    type,
    id,
    name,
    CASE
        WHEN type = 'cinematic' THEN 'System Preset (No Creator)'
        WHEN user_id IS NULL THEN 'System Preset (No Creator)'
        ELSE user_id::text
    END as creator_info,
    category,
    created_at,
    CASE
        WHEN type = 'cinematic' THEN '✅ This is a CINEMATIC preset - "System" is correct'
        WHEN user_id IS NULL THEN '⚠️  This is a regular preset with no user_id'
        ELSE '✅ This is a USER-CREATED preset - should show creator name'
    END as verdict
FROM preset_check;

-- If no results, preset doesn't exist
SELECT
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM presets WHERE id = :'preset_id')
             AND NOT EXISTS (SELECT 1 FROM cinematic_presets WHERE id = :'preset_id')
        THEN '❌ Preset not found in either table'
        ELSE '✅ Preset found above'
    END as status;
