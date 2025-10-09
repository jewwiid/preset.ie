-- Test if we can read the allow_gig_invites column
SELECT 
  id,
  handle,
  display_name,
  role_flags,
  allow_gig_invites
FROM users_profile
WHERE handle = 'james_actor'
LIMIT 1;
