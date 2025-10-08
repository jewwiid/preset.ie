-- Add exif_json column to playground_gallery table
ALTER TABLE public.playground_gallery
ADD COLUMN IF NOT EXISTS exif_json jsonb;

-- Add a comment to document the column
COMMENT ON COLUMN public.playground_gallery.exif_json IS 'EXIF data and generation metadata including promoted_from_playground flag and generation parameters';

-- Create index for faster queries on promoted_from_playground flag
CREATE INDEX IF NOT EXISTS idx_playground_gallery_exif_promoted
ON public.playground_gallery USING gin ((exif_json -> 'promoted_from_playground'));

-- Create index for faster queries on style in generation_metadata
CREATE INDEX IF NOT EXISTS idx_playground_gallery_exif_style
ON public.playground_gallery USING gin ((exif_json -> 'generation_metadata' -> 'style'));

-- Create index for faster queries on preset_id in generation_metadata
CREATE INDEX IF NOT EXISTS idx_playground_gallery_exif_preset_id
ON public.playground_gallery USING gin ((exif_json -> 'generation_metadata' -> 'preset_id'));
