-- Add header_banner_url field to users_profile table
-- Run this in the Supabase SQL Editor

ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS header_banner_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users_profile.header_banner_url IS 'URL of the user''s custom header banner image';

-- Create index for better performance when querying profiles with banners
CREATE INDEX IF NOT EXISTS idx_users_profile_header_banner_url ON users_profile(header_banner_url) WHERE header_banner_url IS NOT NULL;
