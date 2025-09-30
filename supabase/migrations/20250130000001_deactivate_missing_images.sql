-- Temporarily deactivate platform images that don't have actual files yet
-- These can be reactivated once images are uploaded to the platform-images bucket

UPDATE platform_images
SET is_active = false
WHERE image_url LIKE '/images/homepage/%'
   OR image_url LIKE '/images/preset-examples/%';

-- Keep only the hero-bg.jpeg active since it exists in /public
UPDATE platform_images
SET is_active = true
WHERE image_url = '/hero-bg.jpeg';