-- Check if headshot and product presets exist and their visibility settings

-- 1. Check headshot presets
SELECT
    name,
    category,
    is_public,
    is_featured,
    is_active,
    user_id,
    created_at
FROM presets
WHERE
    name ILIKE '%headshot%' OR
    name ILIKE '%professional%portrait%' OR
    name ILIKE '%linkedin%' OR
    category IN ('headshot', 'professional_portrait', 'corporate_portrait', 'business_headshot')
ORDER BY created_at DESC;

-- 2. Check product presets
SELECT
    name,
    category,
    is_public,
    is_featured,
    is_active,
    user_id,
    created_at
FROM presets
WHERE
    name ILIKE '%product%' OR
    name ILIKE '%ecommerce%' OR
    category IN ('product_photography', 'ecommerce', 'product_catalog', 'product_lifestyle', 'product_studio')
ORDER BY created_at DESC;

-- 3. Check all presets for the system user
SELECT
    name,
    category,
    is_public,
    is_featured,
    COUNT(*) OVER() as total_presets
FROM presets
WHERE user_id = 'c231dca2-2973-46f6-98ba-a20c51d71b69'
ORDER BY created_at DESC
LIMIT 20;

-- 4. Count by public status
SELECT
    is_public,
    COUNT(*) as count
FROM presets
GROUP BY is_public;

-- 5. If presets exist but aren't public, show how to fix them
SELECT
    'UPDATE presets SET is_public = true WHERE id = ''' || id || ''';' as fix_query
FROM presets
WHERE
    (name ILIKE '%headshot%' OR
     name ILIKE '%product%' OR
     category IN ('headshot', 'product_photography', 'professional_portrait'))
    AND is_public = false;
