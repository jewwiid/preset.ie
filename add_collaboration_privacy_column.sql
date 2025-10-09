-- Add collaboration invitation privacy setting to users_profile
-- This column controls whether users can receive collaboration invitations

-- Add the column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS allow_collaboration_invites BOOLEAN DEFAULT true;

-- Create index for filtering in user search
CREATE INDEX IF NOT EXISTS idx_users_profile_allow_collaboration_invites 
ON users_profile(allow_collaboration_invites);

-- Add comment
COMMENT ON COLUMN users_profile.allow_collaboration_invites IS 
'Privacy: Allow users to send collaboration/project invitations. When false, user will not appear in invitation search results and cannot receive new invitations.';

-- Set to true for all existing users
UPDATE users_profile
SET allow_collaboration_invites = true
WHERE allow_collaboration_invites IS NULL;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns
WHERE table_name = 'users_profile' AND column_name = 'allow_collaboration_invites';

-- Check a few user records
SELECT 
  id,
  display_name,
  handle,
  allow_collaboration_invites
FROM users_profile
WHERE handle IN ('james_actor', 'sarahchen_photo')
LIMIT 5;

