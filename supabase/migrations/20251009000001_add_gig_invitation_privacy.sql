-- Add privacy setting for gig invitations
-- This allows users to control whether they want to receive gig invitations

-- Add allow_gig_invites column to users_profile
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS allow_gig_invites BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN users_profile.allow_gig_invites IS 'Whether the user allows receiving gig invitations from contributors';

-- Note: The directory_profiles view may need to be updated separately 
-- if it exists, to include allow_gig_invites column

