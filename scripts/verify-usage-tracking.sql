-- Verification script for usage tracking fix
-- Run this after applying the migration to verify everything is working

-- 1. Check if the trigger exists
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    proname as function_name,
    tgenabled as is_enabled
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_auto_increment_preset_usage_count';

-- 2. Check preset usage counts vs actual usage records
SELECT
    'Usage Count Accuracy' as check_type,
    COUNT(*) as presets_checked,
    COUNT(*) FILTER (WHERE p.usage_count = actual_count) as accurate_presets,
    COUNT(*) FILTER (WHERE p.usage_count != actual_count) as inaccurate_presets,
    SUM(p.usage_count) as total_usage_count_in_presets,
    SUM(actual_count) as total_usage_records
FROM presets p
LEFT JOIN (
    SELECT preset_id, COUNT(*) as actual_count
    FROM preset_usage
    GROUP BY preset_id
) pu ON p.id = pu.preset_id;

-- 3. Show sample of presets with their usage counts
SELECT
    p.name,
    p.usage_count as displayed_count,
    COALESCE(pu.actual_count, 0) as actual_usage_records,
    p.last_used_at
FROM presets p
LEFT JOIN (
    SELECT preset_id, COUNT(*) as actual_count, MAX(created_at) as last_used
    FROM preset_usage
    GROUP BY preset_id
) pu ON p.id = pu.preset_id
ORDER BY p.usage_count DESC NULLS LAST
LIMIT 10;

-- 4. Check if daily unique constraint was removed
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'preset_usage'
AND indexname = 'idx_preset_usage_daily_unique';

-- 5. Test insert (this will trigger the auto-increment if it's working)
-- Note: This is just a check, don't actually insert test data
SELECT
    'Trigger Function Status' as check_type,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'auto_increment_preset_usage_count'
        ) THEN 'Function exists ✓'
        ELSE 'Function missing ✗'
    END as status;

-- 6. Summary Report
SELECT
    (SELECT COUNT(*) FROM presets) as total_presets,
    (SELECT COUNT(*) FROM preset_usage) as total_usage_records,
    (SELECT SUM(usage_count) FROM presets) as sum_of_usage_counts,
    (SELECT COUNT(*) FROM presets WHERE usage_count > 0) as presets_with_usage,
    (SELECT COUNT(DISTINCT preset_id) FROM preset_usage) as presets_actually_used;
