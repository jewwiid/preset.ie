-- Verify the allow_gig_invites column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users_profile'
  AND column_name IN ('allow_collaboration_invites', 'allow_gig_invites')
ORDER BY column_name;
