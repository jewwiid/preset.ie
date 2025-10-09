-- Update James's application to ACCEPTED status
-- Since he accepted an invitation, his application should be ACCEPTED, not PENDING

UPDATE applications 
SET status = 'ACCEPTED'
WHERE gig_id = '722fc087-0e13-4dbd-a608-51c50fe32241'
  AND applicant_user_id = (SELECT id FROM users_profile WHERE handle = 'james_actor')
  AND status = 'PENDING';

-- Verify the update
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
