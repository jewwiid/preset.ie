const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
-- Add vibe_tags column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users_profile' AND column_name = 'vibe_tags') THEN
        ALTER TABLE users_profile ADD COLUMN vibe_tags TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added vibe_tags column to users_profile table';
    ELSE
        RAISE NOTICE 'vibe_tags column already exists';
    END IF;
END 
$$;

-- Add index for better performance on vibe_tags queries
CREATE INDEX IF NOT EXISTS idx_users_profile_vibe_tags ON users_profile USING GIN (vibe_tags);

-- Add comment explaining the column
COMMENT ON COLUMN users_profile.vibe_tags IS 'Array of vibe tags selected by the user (e.g., calm, energetic, creative)';
`;

async function addVibeTags() {
  try {
    console.log('Adding vibe_tags column...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Success! vibe_tags column added.');
    }
  } catch (err) {
    console.error('Error executing SQL:', err);
  }
}

addVibeTags();