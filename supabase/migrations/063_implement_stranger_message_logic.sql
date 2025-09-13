-- Implement stranger message logic and connection detection
-- Migration: 063_implement_stranger_message_logic.sql

-- Create function to check if two users have worked together
CREATE OR REPLACE FUNCTION check_user_connection(
  sender_user_id UUID,
  recipient_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if they've worked together on completed gigs
  -- Case 1: One applied to the other's gig and was accepted
  RETURN EXISTS (
    SELECT 1 
    FROM applications a1
    JOIN gigs g ON a1.gig_id = g.id
    JOIN users_profile up ON g.owner_user_id = up.id
    WHERE a1.applicant_user_id = sender_user_id
    AND up.user_id = recipient_user_id
    AND a1.status = 'ACCEPTED'
    AND g.status = 'COMPLETED'
  ) OR EXISTS (
    SELECT 1 
    FROM applications a2
    JOIN gigs g ON a2.gig_id = g.id
    JOIN users_profile up ON g.owner_user_id = up.id
    WHERE a2.applicant_user_id = recipient_user_id
    AND up.user_id = sender_user_id
    AND a2.status = 'ACCEPTED'
    AND g.status = 'COMPLETED'
  ) OR EXISTS (
    -- Case 2: They both worked on the same gig (both were accepted)
    SELECT 1 
    FROM applications a1
    JOIN applications a2 ON a1.gig_id = a2.gig_id
    WHERE a1.applicant_user_id = sender_user_id
    AND a2.applicant_user_id = recipient_user_id
    AND a1.status = 'ACCEPTED'
    AND a2.status = 'ACCEPTED'
    AND a1.gig_id IN (
      SELECT id FROM gigs WHERE status = 'COMPLETED'
    )
  ) OR EXISTS (
    -- Case 3: They have mutual showcases together
    SELECT 1 
    FROM showcases s
    WHERE (s.creator_user_id = sender_user_id AND s.talent_user_id = recipient_user_id)
    OR (s.creator_user_id = recipient_user_id AND s.talent_user_id = sender_user_id)
    AND s.visibility = 'PUBLIC'
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to validate message sending based on stranger settings
CREATE OR REPLACE FUNCTION validate_message_permission(
  sender_user_id UUID,
  recipient_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  recipient_settings RECORD;
  are_connected BOOLEAN;
BEGIN
  -- Get recipient's messaging settings
  SELECT allow_stranger_messages 
  INTO recipient_settings
  FROM user_settings 
  WHERE user_id = recipient_user_id;
  
  -- If no settings found, default to allowing strangers
  IF recipient_settings IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If recipient allows stranger messages, allow it
  IF recipient_settings.allow_stranger_messages THEN
    RETURN TRUE;
  END IF;
  
  -- Check if they have a connection
  SELECT check_user_connection(sender_user_id, recipient_user_id) INTO are_connected;
  
  -- Allow if they have a connection
  RETURN are_connected;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION check_user_connection(UUID, UUID) IS 'Checks if two users have worked together through completed gigs or showcases';
COMMENT ON FUNCTION validate_message_permission(UUID, UUID) IS 'Validates if a user can send a message to another user based on stranger message settings';

-- Create index for performance on applications lookups
CREATE INDEX IF NOT EXISTS idx_applications_user_gig_status 
ON applications(applicant_user_id, gig_id, status) 
WHERE status = 'ACCEPTED';

-- Create index for performance on gigs lookups
CREATE INDEX IF NOT EXISTS idx_gigs_owner_status 
ON gigs(owner_user_id, status) 
WHERE status = 'COMPLETED';

-- Create index for performance on showcases lookups
CREATE INDEX IF NOT EXISTS idx_showcases_participants 
ON showcases(creator_user_id, talent_user_id, visibility) 
WHERE visibility = 'PUBLIC';
