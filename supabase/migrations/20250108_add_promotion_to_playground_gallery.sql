-- Add is_verified and verification_timestamp columns to playground_gallery
-- This allows admins and preset creators to promote gallery images to be featured

ALTER TABLE public.playground_gallery
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

ALTER TABLE public.playground_gallery
ADD COLUMN IF NOT EXISTS verification_timestamp timestamp with time zone;

-- Add comment to document the columns
COMMENT ON COLUMN public.playground_gallery.is_verified IS 'Whether this image has been promoted to be featured as a preset example';
COMMENT ON COLUMN public.playground_gallery.verification_timestamp IS 'Timestamp when the image was promoted';

-- Create index for faster queries on promoted images
CREATE INDEX IF NOT EXISTS idx_playground_gallery_is_verified
ON public.playground_gallery USING btree (is_verified);
