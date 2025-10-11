-- Add 'role' and 'general' to valid image types
ALTER TABLE platform_images
DROP CONSTRAINT IF EXISTS valid_image_type;

ALTER TABLE platform_images
ADD CONSTRAINT valid_image_type CHECK (
  image_type IN (
    'homepage',
    'preset_visual_aid',
    'category_icon',
    'marketing',
    'feature_showcase',
    'role',
    'general',
    'about',
    'hero',
    'section'
  )
);
