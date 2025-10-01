-- Check what actual usage data exists

-- 1. Check how many usage records exist
SELECT 'Total usage records' as metric, COUNT(*) as value FROM preset_usage
UNION ALL
SELECT 'Total presets' as metric, COUNT(*) as value FROM presets
UNION ALL
SELECT 'Presets with usage_count > 0' as metric, COUNT(*) as value FROM presets WHERE usage_count > 0
UNION ALL
SELECT 'Presets actually used' as metric, COUNT(DISTINCT preset_id) as value FROM preset_usage;

-- 2. Show sample presets with their usage counts
SELECT
    p.id,
    p.name,
    p.usage_count,
    COUNT(pu.id) as actual_usage_records,
    p.last_used_at,
    MAX(pu.created_at) as last_usage_record
FROM presets p
LEFT JOIN preset_usage pu ON p.id = pu.preset_id
GROUP BY p.id, p.name, p.usage_count, p.last_used_at
ORDER BY p.usage_count DESC NULLS LAST
LIMIT 20;

-- 3. Check if there's a mismatch
SELECT
    COUNT(*) as presets_with_mismatch,
    SUM(CASE WHEN p.usage_count > actual_count THEN 1 ELSE 0 END) as count_too_high,
    SUM(CASE WHEN p.usage_count < actual_count THEN 1 ELSE 0 END) as count_too_low
FROM presets p
LEFT JOIN (
    SELECT preset_id, COUNT(*) as actual_count
    FROM preset_usage
    GROUP BY preset_id
) pu ON p.id = pu.preset_id
WHERE p.usage_count != COALESCE(pu.actual_count, 0);
