-- Test if auto-application creation is working
-- Check current applications for the gig
SELECT 
  a.id as application_id,
  g.title as gig_title,
  up.display_name as applicant_name,
  a.status,
  a.applied_at,
  a.note
FROM applications a
JOIN gigs g ON g.id = a.gig_id
JOIN users_profile up ON up.id = a.applicant_user_id
WHERE a.gig_id = '722fc087-0e13-4dbd-a608-51c50fe32241';

-- Check if James has any applications
SELECT 
  a.id,
  g.title,
  a.status,
  a.applied_at
FROM applications a
JOIN gigs g ON g.id = a.gig_id
WHERE a.applicant_user_id = (SELECT id FROM users_profile WHERE handle = 'james_actor');

-- Check current invitation status
SELECT 
  gi.id,
  gi.status,
  gi.message,
  gi.created_at,
  gi.responded_at,
  up_inviter.display_name as inviter_name,
  up_invitee.display_name as invitee_name
FROM gig_invitations gi
JOIN users_profile up_inviter ON up_inviter.id = gi.inviter_id
JOIN users_profile up_invitee ON up_invitee.id = gi.invitee_id
WHERE gi.id = 'a73fc1c9-cdaa-44f7-ae5c-6b40440617c3';
