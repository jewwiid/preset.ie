-- Rename "style" category to "effects" for better clarity
-- This makes it clear these are artistic effects, not photography types

-- Step 1: Update all existing "style" presets to "effects" FIRST
UPDATE presets 
SET category = 'effects'
WHERE category = 'style';

-- Step 2: Update the constraint to include "effects" and remove "style"
ALTER TABLE presets DROP CONSTRAINT IF EXISTS valid_category;

ALTER TABLE presets ADD CONSTRAINT valid_category CHECK (
    category IN (
        'effects',  -- Changed from 'style' to 'effects'
        'cinematic', 
        'technical', 
        'custom',
        'headshot',
        'product_photography',
        'instant_film',
        'wedding_events',
        'real_estate',
        'fashion_lifestyle',
        'food_culinary',
        'pet_animal',
        'travel_landscape',
        'artistic',
        'corporate_portrait',
        'ecommerce',
        'linkedin_photo',
        'product_lifestyle',
        'product_studio'
    )
);

-- Step 3: Verify the changes
SELECT 
    name,
    category,
    'Updated to effects' as status
FROM presets 
WHERE category = 'effects'
ORDER BY name;

-- Show count of updated records
SELECT 
    COUNT(*) as total_effects_presets,
    'All style presets renamed to effects' as summary
FROM presets 
WHERE category = 'effects';
