-- Create application for James since he accepted the invitation
-- This is a one-time fix for the existing accepted invitation

INSERT INTO applications (
  gig_id,
  applicant_user_id,
  note,
  status,
  applied_at
)
SELECT 
  gi.gig_id,
  gi.invitee_id,
  'Accepted invitation: ' || COALESCE(gi.message, 'Invitation from gig creator'),
  'PENDING',
  gi.responded_at
FROM gig_invitations gi
WHERE gi.id = 'a73fc1c9-cdaa-44f7-ae5c-6b40440617c3'
  AND gi.status = 'accepted'
  AND NOT EXISTS (
    SELECT 1 FROM applications a
    WHERE a.gig_id = gi.gig_id
    AND a.applicant_user_id = gi.invitee_id
  );

-- Verify the application was created
SELECT 
  a.id,
  g.title as gig_title,
  up.display_name as applicant_name,
  a.status,
  a.applied_at,
  a.note
FROM applications a
JOIN gigs g ON g.id = a.gig_id
JOIN users_profile up ON up.id = a.applicant_user_id
WHERE a.gig_id = '722fc087-0e13-4dbd-a608-51c50fe32241'
AND a.applicant_user_id = (SELECT id FROM users_profile WHERE handle = 'james_actor');

