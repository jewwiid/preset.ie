-- CORRECTED VERSION: Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/sql/new

-- Add vibe_tags column to users_profile table
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS vibe_tags TEXT[] DEFAULT '{}';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_vibe_tags ON users_profile USING GIN (vibe_tags);

-- Add comment
COMMENT ON COLUMN users_profile.vibe_tags IS 'Array of vibe tags selected by the user';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name IN ('style_tags', 'vibe_tags')
ORDER BY column_name;