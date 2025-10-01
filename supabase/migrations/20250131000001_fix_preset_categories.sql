-- Migration: Fix preset categories constraint and update existing data
-- This migration expands the valid categories and updates existing presets

-- Drop the existing constraint
ALTER TABLE presets DROP CONSTRAINT IF EXISTS valid_category;

-- Create new constraint with all the categories the frontend expects
ALTER TABLE presets ADD CONSTRAINT valid_category CHECK (category IN (
    -- Original categories
    'style', 'cinematic', 'technical', 'custom',
    
    -- Headshot categories
    'headshot', 'corporate_portrait', 'linkedin_photo', 'professional_portrait', 'business_headshot',
    
    -- Product categories  
    'product_photography', 'product_catalog', 'product_lifestyle', 'product_studio', 'ecommerce',
    
    -- Instant film category
    'instant_film',
    
    -- Other categories
    'abstract', 'artistic', 'fashion', 'food', 'jewelry', 'automotive', 'furniture', 'electronics', 'beauty'
));

-- Update existing presets to use correct categories
UPDATE presets 
SET category = 'headshot' 
WHERE ai_metadata->>'preset_type' = 'headshot';

UPDATE presets 
SET category = 'product_photography' 
WHERE ai_metadata->>'preset_type' = 'product';

UPDATE presets 
SET category = 'instant_film' 
WHERE ai_metadata->>'preset_type' = 'instant_film';

-- Update specific specializations to more specific categories
UPDATE presets 
SET category = 'corporate_portrait' 
WHERE ai_metadata->>'specialization' = 'corporate_portrait';

UPDATE presets 
SET category = 'linkedin_photo' 
WHERE ai_metadata->>'specialization' = 'linkedin_photo';

UPDATE presets 
SET category = 'ecommerce' 
WHERE ai_metadata->>'specialization' = 'ecommerce';

UPDATE presets 
SET category = 'product_catalog' 
WHERE ai_metadata->>'specialization' = 'product_catalog';

UPDATE presets 
SET category = 'product_lifestyle' 
WHERE ai_metadata->>'specialization' = 'product_lifestyle';

UPDATE presets 
SET category = 'product_studio' 
WHERE ai_metadata->>'specialization' = 'product_studio';

UPDATE presets 
SET category = 'business_headshot' 
WHERE ai_metadata->>'specialization' = 'business_headshot';

UPDATE presets 
SET category = 'professional_portrait' 
WHERE ai_metadata->>'specialization' = 'professional_portrait';

-- Update product specializations to specific categories
UPDATE presets 
SET category = 'food' 
WHERE ai_metadata->>'specialization' = 'food_photography';

UPDATE presets 
SET category = 'jewelry' 
WHERE ai_metadata->>'specialization' = 'jewelry_photography';

UPDATE presets 
SET category = 'fashion' 
WHERE ai_metadata->>'specialization' = 'fashion_photography';

UPDATE presets 
SET category = 'electronics' 
WHERE ai_metadata->>'specialization' = 'electronics_photography';

UPDATE presets 
SET category = 'beauty' 
WHERE ai_metadata->>'specialization' = 'beauty_photography';

UPDATE presets 
SET category = 'automotive' 
WHERE ai_metadata->>'specialization' = 'automotive_photography';

UPDATE presets 
SET category = 'furniture' 
WHERE ai_metadata->>'specialization' = 'furniture_photography';

-- Update headshot specializations
UPDATE presets 
SET category = 'headshot' 
WHERE ai_metadata->>'specialization' IN ('executive_portrait', 'actor_headshot', 'real_estate_portrait', 'healthcare_portrait', 'tech_portrait');

-- Set remaining style presets to appropriate categories
UPDATE presets 
SET category = 'abstract' 
WHERE ai_metadata->>'specialization' IN ('abstract', 'surreal', 'minimalist', 'maximalist');

UPDATE presets 
SET category = 'artistic' 
WHERE ai_metadata->>'specialization' IN ('artistic', 'watercolor', 'oil_painting', 'sketch', 'impressionist', 'renaissance', 'baroque');

UPDATE presets 
SET category = 'custom' 
WHERE ai_metadata->>'specialization' = 'custom';

-- Add comment to document the change
COMMENT ON CONSTRAINT valid_category ON presets IS 'Validates preset categories to match frontend expectations';
