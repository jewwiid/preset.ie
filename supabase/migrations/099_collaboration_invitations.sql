-- =====================================================
-- COLLABORATION INVITATIONS MIGRATION
-- =====================================================
-- Migration: 099_collaboration_invitations.sql
-- Description: Add invitation system for private and invite-only projects
-- Dependencies: 098_collaboration_system.sql

-- =====================================================
-- INVITATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS collab_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  invitee_email TEXT,
  role_id UUID REFERENCES collab_roles(id) ON DELETE SET NULL,
  invitation_token TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')) DEFAULT 'pending',
  message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_invitee CHECK (
    invitee_id IS NOT NULL OR invitee_email IS NOT NULL
  )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_collab_invitations_project_id ON collab_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_invitations_inviter_id ON collab_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_collab_invitations_invitee_id ON collab_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_collab_invitations_invitee_email ON collab_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_collab_invitations_status ON collab_invitations(status);
CREATE INDEX IF NOT EXISTS idx_collab_invitations_token ON collab_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_collab_invitations_expires_at ON collab_invitations(expires_at);

-- Partial unique index to prevent duplicate pending invitations
-- This ensures one user can't have multiple pending invitations to the same project
CREATE UNIQUE INDEX IF NOT EXISTS idx_collab_invitations_unique_pending 
  ON collab_invitations(project_id, invitee_id) 
  WHERE status = 'pending' AND invitee_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE collab_invitations ENABLE ROW LEVEL SECURITY;

-- Users can read invitations they sent or received
CREATE POLICY "collab_invitations_read_own" ON collab_invitations 
  FOR SELECT USING (
    auth.uid() = inviter_id OR
    auth.uid() = invitee_id OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      WHERE cp.id = project_id 
      AND cp.creator_id = auth.uid()
    )
  );

-- Project creators and inviters can create invitations
CREATE POLICY "collab_invitations_insert_own" ON collab_invitations 
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      WHERE cp.id = project_id 
      AND (cp.creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM collab_participants cpp 
                   WHERE cpp.project_id = cp.id 
                   AND cpp.user_id = auth.uid() 
                   AND cpp.role_type = 'creator'))
    )
  );

-- Inviters and invitees can update invitations
CREATE POLICY "collab_invitations_update_own" ON collab_invitations 
  FOR UPDATE USING (
    auth.uid() = inviter_id OR
    auth.uid() = invitee_id OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      WHERE cp.id = project_id 
      AND cp.creator_id = auth.uid()
    )
  );

-- Only inviters and project creators can delete invitations
CREATE POLICY "collab_invitations_delete_own" ON collab_invitations 
  FOR DELETE USING (
    auth.uid() = inviter_id OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      WHERE cp.id = project_id 
      AND cp.creator_id = auth.uid()
    )
  );

-- =====================================================
-- UPDATE PROJECT VISIBILITY POLICIES
-- =====================================================

-- Drop the old project read policy
DROP POLICY IF EXISTS "collab_projects_read" ON collab_projects;

-- Create new policy that includes invited users
CREATE POLICY "collab_projects_read" ON collab_projects 
  FOR SELECT USING (
    visibility = 'public' OR 
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM collab_participants cp 
      WHERE cp.project_id = id AND cp.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM collab_invitations ci
      WHERE ci.project_id = id 
      AND ci.invitee_id = auth.uid()
      AND ci.status IN ('pending', 'accepted')
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_token IS NULL THEN
    NEW.invitation_token := encode(gen_random_bytes(32), 'base64');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate invitation token
CREATE TRIGGER generate_invitation_token_trigger
  BEFORE INSERT ON collab_invitations
  FOR EACH ROW
  EXECUTE FUNCTION generate_invitation_token();

-- Function to update invitation responded_at timestamp
CREATE OR REPLACE FUNCTION update_invitation_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'declined') THEN
    NEW.responded_at := NOW();
    
    -- If accepted, also set accepted_at
    IF NEW.status = 'accepted' THEN
      NEW.accepted_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update responded_at
CREATE TRIGGER update_invitation_responded_at_trigger
  BEFORE UPDATE ON collab_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_responded_at();

-- Function to automatically add invited user as participant when invitation is accepted
CREATE OR REPLACE FUNCTION add_invited_user_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO collab_participants (project_id, user_id, role_type, role_id, status)
    VALUES (
      NEW.project_id, 
      NEW.invitee_id, 
      CASE WHEN NEW.role_id IS NOT NULL THEN 'collaborator' ELSE 'collaborator' END,
      NEW.role_id,
      'active'
    )
    ON CONFLICT (project_id, user_id) DO UPDATE SET
      role_type = 'collaborator',
      role_id = COALESCE(NEW.role_id, collab_participants.role_id),
      status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add invited user as participant
CREATE TRIGGER add_invited_user_as_participant_trigger
  AFTER UPDATE ON collab_invitations
  FOR EACH ROW
  EXECUTE FUNCTION add_invited_user_as_participant();

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE collab_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to expire old invitations (if pg_cron is available)
-- This is optional and depends on your Supabase setup
-- SELECT cron.schedule('expire-invitations', '0 * * * *', 'SELECT expire_old_invitations()');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has access to a project
CREATE OR REPLACE FUNCTION user_has_project_access(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_visibility TEXT;
  v_creator_id UUID;
BEGIN
  -- Get project visibility and creator
  SELECT visibility, creator_id INTO v_visibility, v_creator_id
  FROM collab_projects
  WHERE id = p_project_id;
  
  -- Public projects are accessible to everyone
  IF v_visibility = 'public' THEN
    RETURN TRUE;
  END IF;
  
  -- Creator has access
  IF v_creator_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is a participant
  IF EXISTS (
    SELECT 1 FROM collab_participants
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND status = 'active'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has an accepted invitation
  IF EXISTS (
    SELECT 1 FROM collab_invitations
    WHERE project_id = p_project_id
    AND invitee_id = p_user_id
    AND status = 'accepted'
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's invitation statistics
CREATE OR REPLACE FUNCTION get_user_invitation_stats(p_user_id UUID)
RETURNS TABLE (
  pending_invitations INTEGER,
  accepted_invitations INTEGER,
  sent_invitations INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE invitee_id = p_user_id AND status = 'pending')::INTEGER,
    COUNT(*) FILTER (WHERE invitee_id = p_user_id AND status = 'accepted')::INTEGER,
    COUNT(*) FILTER (WHERE inviter_id = p_user_id)::INTEGER
  FROM collab_invitations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE collab_invitations IS 'Invitations for users to join private or invite-only projects';
COMMENT ON COLUMN collab_invitations.invitation_token IS 'Unique token for email-based invitations';
COMMENT ON COLUMN collab_invitations.invitee_email IS 'Email address for inviting users not yet on the platform';
COMMENT ON COLUMN collab_invitations.expires_at IS 'Invitation expiration date (default 30 days)';
COMMENT ON COLUMN collab_invitations.message IS 'Personal message from the inviter';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log successful migration
INSERT INTO system_alerts (type, level, message, metadata)
VALUES (
    'migration_completed',
    'info',
    'Collaboration invitations migration completed successfully',
    '{"migration": "099_collaboration_invitations.sql", "tables_created": 1, "indexes_created": 8, "policies_created": 4, "functions_created": 6}'
) ON CONFLICT DO NOTHING;
