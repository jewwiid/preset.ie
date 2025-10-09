-- Verify that the gig invitation was successfully created

SELECT 
  gi.id,
  gi.status,
  gi.created_at,
  gi.message,
  inviter.display_name as inviter_name,
  invitee.display_name as invitee_name,
  g.title as gig_title
FROM gig_invitations gi
JOIN users_profile inviter ON gi.inviter_id = inviter.id
JOIN users_profile invitee ON gi.invitee_id = invitee.id
JOIN gigs g ON gi.gig_id = g.id
WHERE gi.gig_id = '722fc087-0e13-4dbd-a608-51c50fe32241'
ORDER BY gi.created_at DESC
LIMIT 5;

