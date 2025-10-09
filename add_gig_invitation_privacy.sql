-- Add privacy setting for gig invitations
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS allow_gig_invites BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN users_profile.allow_gig_invites IS 'Whether the user allows receiving gig invitations from contributors';
