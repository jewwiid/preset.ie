-- Check admin user presets
-- Admin user_id: c231dca2-2973-46f6-98ba-a20c51d71b69

-- 1. Total presets owned by admin user
SELECT
    'Total Presets Owned by Admin' as metric,
    COUNT(*) as count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 2. Public vs Private presets breakdown
SELECT
    'Public vs Private Breakdown' as metric,
    is_public,
    COUNT(*) as count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
GROUP BY is_public;

-- 3. Featured presets count
SELECT
    'Featured Presets' as metric,
    COUNT(*) as count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
    AND is_featured = true;

-- 4. Presets that meet /presets page criteria (is_public = true)
SELECT
    'Presets Shown on /presets Page (is_public=true)' as metric,
    COUNT(*) as count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
    AND is_public = true;

-- 5. Category breakdown for admin's public presets
SELECT
    'Category Breakdown (Public Presets)' as metric,
    category,
    COUNT(*) as count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
    AND is_public = true
GROUP BY category
ORDER BY count DESC;

-- 6. Detailed list of admin's presets with key fields
SELECT
    id,
    name,
    category,
    is_public,
    is_featured,
    usage_count,
    created_at
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
ORDER BY created_at DESC;

-- 7. Check if there are any limits/pagination in the API
-- (This is code-based, but let's show what the current default is)
SELECT
    'API Default Pagination Settings' as info,
    'Default limit: 20 per page' as setting,
    'Configurable via ?limit= query param' as note;

-- 8. Summary statistics
SELECT
    COUNT(*) as total_presets,
    COUNT(CASE WHEN is_public = true THEN 1 END) as public_presets,
    COUNT(CASE WHEN is_public = false THEN 1 END) as private_presets,
    COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_presets,
    COUNT(CASE WHEN is_public = true AND is_featured = true THEN 1 END) as public_and_featured,
    SUM(usage_count) as total_usage_count,
    AVG(usage_count) as avg_usage_count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';
