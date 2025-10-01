-- Reset all usage counts to zero for a fresh start
-- This will give you accurate tracking from this point forward

-- Option 1: Reset ALL presets to zero (nuclear option)
-- Uncomment if you want to start completely fresh
-- UPDATE presets SET usage_count = 0, last_used_at = NULL;

-- Option 2: Only sync with actual preset_usage records (recommended)
-- This preserves any real usage that's been tracked
UPDATE presets p
SET usage_count = COALESCE((
    SELECT COUNT(*)
    FROM preset_usage pu
    WHERE pu.preset_id = p.id
), 0),
last_used_at = (
    SELECT MAX(created_at)
    FROM preset_usage pu
    WHERE pu.preset_id = p.id
);

-- Show summary of what was updated
SELECT
    'Presets reset' as action,
    COUNT(*) as total_presets,
    COUNT(*) FILTER (WHERE usage_count = 0) as zero_usage,
    COUNT(*) FILTER (WHERE usage_count > 0) as with_usage,
    SUM(usage_count) as total_usage_count
FROM presets;

-- Show top 10 presets by usage after reset
SELECT
    name,
    usage_count,
    last_used_at,
    created_at
FROM presets
WHERE usage_count > 0
ORDER BY usage_count DESC
LIMIT 10;
