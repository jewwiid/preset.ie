-- Add header_banner_position field to users_profile table
ALTER TABLE public.users_profile 
ADD COLUMN IF NOT EXISTS header_banner_position TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users_profile.header_banner_position IS 'JSON string containing banner position data (x, y, scale)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_header_banner_position 
ON public.users_profile(header_banner_position) 
WHERE header_banner_position IS NOT NULL;
