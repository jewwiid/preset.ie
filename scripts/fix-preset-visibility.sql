-- Fix visibility for headshot and product presets
-- Make them public so they appear in search results

-- Update headshot presets to be public
UPDATE presets
SET
    is_public = true,
    is_featured = true,
    updated_at = NOW()
WHERE
    (
        name ILIKE '%headshot%' OR
        name ILIKE '%professional%portrait%' OR
        name ILIKE '%linkedin%' OR
        name ILIKE '%corporate%portrait%' OR
        category IN ('headshot', 'professional_portrait', 'corporate_portrait', 'business_headshot', 'linkedin_photo')
    )
    AND is_public = false;

-- Update product photography presets to be public
UPDATE presets
SET
    is_public = true,
    is_featured = true,
    updated_at = NOW()
WHERE
    (
        name ILIKE '%product%' OR
        name ILIKE '%ecommerce%' OR
        name ILIKE '%catalog%' OR
        category IN ('product_photography', 'ecommerce', 'product_catalog', 'product_lifestyle', 'product_studio')
    )
    AND is_public = false;

-- Verify the updates
SELECT
    name,
    category,
    is_public,
    is_featured,
    updated_at
FROM presets
WHERE
    name ILIKE '%headshot%' OR
    name ILIKE '%product%' OR
    category IN ('headshot', 'product_photography', 'professional_portrait', 'ecommerce')
ORDER BY name;

-- Show count of public vs private presets
SELECT
    is_public,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_featured = true) as featured_count
FROM presets
GROUP BY is_public;
