-- Add width and height columns to playground_gallery table
-- These columns are needed for proper aspect ratio display in the UI

ALTER TABLE playground_gallery 
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN playground_gallery.width IS 'Image/video width in pixels';
COMMENT ON COLUMN playground_gallery.height IS 'Image/video height in pixels';
COMMENT ON COLUMN playground_gallery.thumbnail_url IS 'Thumbnail URL for videos or optimized image previews';
