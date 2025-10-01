-- Debug why presets aren't showing up in search
-- Run this to investigate preset visibility issues

-- 1. Check if presets exist in database
SELECT
    name,
    category,
    is_public,
    is_featured,
    created_at,
    user_id,
    id
FROM presets
WHERE name LIKE '%Headshot%' OR name LIKE '%Product%'
ORDER BY created_at DESC;

-- 2. Check RLS policies on presets table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'presets'
ORDER BY policyname;

-- 3. Check if user exists
SELECT
    id,
    email,
    created_at
FROM auth.users
WHERE id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 4. Count presets by category
SELECT
    category,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_public = true) as public_count,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_count
FROM presets
GROUP BY category
ORDER BY count DESC;

-- 5. Check presets with specific categories
SELECT
    name,
    category,
    is_public,
    is_featured,
    usage_count,
    user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69' as is_system_preset
FROM presets
WHERE category IN ('headshot', 'product_photography', 'professional_portrait', 'ecommerce')
ORDER BY created_at DESC;

-- 6. Search by name pattern
SELECT
    name,
    category,
    description,
    is_public,
    ai_metadata->>'tags' as tags
FROM presets
WHERE
    name ILIKE '%professional%' OR
    name ILIKE '%headshot%' OR
    name ILIKE '%product%' OR
    description ILIKE '%headshot%' OR
    description ILIKE '%product%'
ORDER BY name;

-- 7. Check if presets have proper metadata
SELECT
    name,
    category,
    ai_metadata,
    style_settings,
    technical_settings
FROM presets
WHERE name LIKE '%Professional%Headshot%'
LIMIT 1;

-- 8. Test RLS by simulating different user contexts
-- Public presets (should be visible to everyone)
SELECT COUNT(*) as public_presets_count
FROM presets
WHERE is_public = true;

-- User's own presets
SELECT COUNT(*) as user_presets_count
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69';

-- 9. Check for any NULL or invalid values
SELECT
    name,
    category IS NULL as category_null,
    is_public IS NULL as is_public_null,
    user_id IS NULL as user_id_null,
    prompt_template IS NULL as prompt_null
FROM presets
WHERE
    category IS NULL OR
    is_public IS NULL OR
    user_id IS NULL OR
    prompt_template IS NULL
LIMIT 10;

-- 10. Full text search test
SELECT
    name,
    category,
    ts_rank(
        to_tsvector('english', name || ' ' || COALESCE(description, '')),
        to_tsquery('english', 'headshot | product')
    ) as rank
FROM presets
WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ to_tsquery('english', 'headshot | product')
ORDER BY rank DESC
LIMIT 10;
