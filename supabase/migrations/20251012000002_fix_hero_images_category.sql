-- Fix hero images that have image_type='hero' but missing category
-- This ensures they appear on the homepage hero section

UPDATE platform_images
SET category = 'hero'
WHERE image_type = 'hero'
  AND (category IS NULL OR category = '');

-- Add comment for documentation
COMMENT ON COLUMN platform_images.category IS 'Category for organizing images (e.g., hero, about, role-actors). Used with image_type to filter images for specific sections.';
