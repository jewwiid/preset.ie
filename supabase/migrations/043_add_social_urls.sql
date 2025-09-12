-- Add URL columns for social platforms to store generated URLs
-- This allows us to store both the clean username and the full platform URL

-- Add social URL columns to users_profile table
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add validation constraints for URLs
ALTER TABLE users_profile 
ADD CONSTRAINT valid_instagram_url 
    CHECK (instagram_url IS NULL OR instagram_url ~* '^https://instagram\.com/[a-zA-Z0-9._]+$'),
ADD CONSTRAINT valid_tiktok_url 
    CHECK (tiktok_url IS NULL OR tiktok_url ~* '^https://tiktok\.com/@[a-zA-Z0-9._]+$'),
ADD CONSTRAINT valid_twitter_url 
    CHECK (twitter_url IS NULL OR twitter_url ~* '^https://twitter\.com/[a-zA-Z0-9_]+$'),
ADD CONSTRAINT valid_linkedin_url 
    CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https://linkedin\.com/in/[a-zA-Z0-9-]+$');

-- Update existing records to generate URLs from existing handles (if any exist)
UPDATE users_profile 
SET instagram_url = 'https://instagram.com/' || instagram_handle 
WHERE instagram_handle IS NOT NULL AND instagram_handle != '' AND instagram_url IS NULL;

UPDATE users_profile 
SET tiktok_url = 'https://tiktok.com/@' || tiktok_handle 
WHERE tiktok_handle IS NOT NULL AND tiktok_handle != '' AND tiktok_url IS NULL;

-- Add helpful comment
COMMENT ON COLUMN users_profile.instagram_url IS 'Full Instagram profile URL generated from handle';
COMMENT ON COLUMN users_profile.tiktok_url IS 'Full TikTok profile URL generated from handle';
COMMENT ON COLUMN users_profile.twitter_url IS 'Full Twitter/X profile URL generated from handle';
COMMENT ON COLUMN users_profile.linkedin_url IS 'Full LinkedIn profile URL generated from handle';