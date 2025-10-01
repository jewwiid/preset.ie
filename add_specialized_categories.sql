-- Add new specialized categories to the valid_category constraint
-- This allows the specialized preset categories to be used

-- First, drop the existing constraint
ALTER TABLE presets DROP CONSTRAINT IF EXISTS valid_category;

-- Add the new constraint with all specialized categories
ALTER TABLE presets ADD CONSTRAINT valid_category CHECK (
    category IN (
        'style', 
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

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_category' 
AND conrelid = 'presets'::regclass;
