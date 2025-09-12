-- Add vibe_tags column to users_profile table
-- This column was referenced in the Profile component but missing from the schema

-- Add vibe_tags column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'vibe_tags') THEN
        ALTER TABLE users_profile ADD COLUMN vibe_tags TEXT[] DEFAULT '{}';
    END IF;
END 
$$;

-- Add index for better performance on vibe_tags queries
CREATE INDEX IF NOT EXISTS idx_users_profile_vibe_tags ON users_profile USING GIN (vibe_tags);

-- Add comment explaining the column
COMMENT ON COLUMN users_profile.vibe_tags IS 'Array of vibe tags selected by the user (e.g., calm, energetic, creative)';