-- Fix foreign key constraints to allow user deletion
-- Add ON DELETE CASCADE to constraints that are blocking user deletion

-- 1. Fix gig_invitations constraints
ALTER TABLE gig_invitations
  DROP CONSTRAINT IF EXISTS gig_invitations_invitee_id_fkey,
  ADD CONSTRAINT gig_invitations_invitee_id_fkey
    FOREIGN KEY (invitee_id) REFERENCES users_profile(id) ON DELETE CASCADE;

ALTER TABLE gig_invitations
  DROP CONSTRAINT IF EXISTS gig_invitations_inviter_id_fkey,
  ADD CONSTRAINT gig_invitations_inviter_id_fkey
    FOREIGN KEY (inviter_id) REFERENCES users_profile(id) ON DELETE CASCADE;

-- 2. Fix application_status_history constraint
ALTER TABLE application_status_history
  DROP CONSTRAINT IF EXISTS application_status_history_changed_by_fkey,
  ADD CONSTRAINT application_status_history_changed_by_fkey
    FOREIGN KEY (changed_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- 3. Fix user_skills verified_by constraint
ALTER TABLE user_skills
  DROP CONSTRAINT IF EXISTS user_skills_verified_by_fkey,
  ADD CONSTRAINT user_skills_verified_by_fkey
    FOREIGN KEY (verified_by) REFERENCES users_profile(id) ON DELETE SET NULL;

-- Verify the changes
DO $$
DECLARE
  missing_cascade_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_cascade_count
  FROM information_schema.referential_constraints rc
  JOIN information_schema.table_constraints tc
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.table_name IN ('gig_invitations', 'application_status_history', 'user_skills')
    AND rc.delete_rule = 'NO ACTION';

  IF missing_cascade_count > 0 THEN
    RAISE WARNING 'Still % constraints without CASCADE/SET NULL', missing_cascade_count;
  ELSE
    RAISE NOTICE '✅ All user deletion constraints fixed';
  END IF;
END $$;
