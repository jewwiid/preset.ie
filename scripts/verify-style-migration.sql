-- Verification script for style documentation migration

-- 1. Check if the validation function exists
SELECT
    proname as function_name,
    pg_get_function_result(oid) as return_type,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'validate_preset_style';

-- 2. Test the validation function with valid styles
SELECT
    'Impressionist' as style,
    validate_preset_style('Impressionist') as is_valid;

SELECT
    'Sci-Fi' as style,
    validate_preset_style('Sci-Fi') as is_valid;

SELECT
    'Invalid Style' as style,
    validate_preset_style('Invalid Style') as is_valid;

-- 3. Check if indexes were created
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'presets'
AND (indexname LIKE '%style%');

-- 4. Check column comments
SELECT
    col_description('presets'::regclass, attnum) as column_comment,
    attname as column_name
FROM pg_attribute
WHERE attrelid = 'presets'::regclass
AND attname IN ('ai_metadata', 'style_settings', 'technical_settings')
ORDER BY attnum;

-- 5. Count existing presets by style
SELECT
    ai_metadata->>'style' as style_name,
    COUNT(*) as preset_count
FROM presets
WHERE ai_metadata->>'style' IS NOT NULL
GROUP BY ai_metadata->>'style'
ORDER BY preset_count DESC;

-- 6. Find presets with invalid style names (not in approved list)
SELECT
    id,
    name,
    ai_metadata->>'style' as style_name,
    validate_preset_style(ai_metadata->>'style') as is_valid_style
FROM presets
WHERE ai_metadata->>'style' IS NOT NULL
AND NOT validate_preset_style(ai_metadata->>'style')
LIMIT 20;
