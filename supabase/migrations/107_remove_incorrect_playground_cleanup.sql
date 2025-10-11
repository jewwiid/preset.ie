-- Remove incorrect cleanup function for playground-uploads
-- Base images should NEVER be auto-deleted (they show source for generations)
--
-- IMPORTANT: playground-uploads/base-images are permanent source material
-- They are referenced in saved videos/images to show what the generation was based on

-- Drop the incorrect cleanup function
DROP FUNCTION IF EXISTS cleanup_old_playground_uploads();
