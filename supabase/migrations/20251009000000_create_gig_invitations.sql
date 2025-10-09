-- ================================================================
-- Gig Invitations System
-- Allows gig owners to directly invite talent to apply for their gigs
-- ================================================================

-- Create gig_invitations table
CREATE TABLE IF NOT EXISTS gig_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  UNIQUE(gig_id, invitee_id) -- Prevent duplicate invitations
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gig_invitations_gig_id ON gig_invitations(gig_id);
CREATE INDEX IF NOT EXISTS idx_gig_invitations_invitee_id ON gig_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_gig_invitations_status ON gig_invitations(status);
CREATE INDEX IF NOT EXISTS idx_gig_invitations_expires_at ON gig_invitations(expires_at);

-- Comments
COMMENT ON TABLE gig_invitations IS 'Direct invitations from gig owners to talent to apply for specific gigs';
COMMENT ON COLUMN gig_invitations.message IS 'Personal message from gig owner to invitee (max 1000 characters)';
COMMENT ON COLUMN gig_invitations.expires_at IS 'Invitation expires after 7 days (shorter than project invitations)';

-- Row Level Security
ALTER TABLE gig_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations they sent or received
CREATE POLICY "Users can view their gig invitations"
  ON gig_invitations
  FOR SELECT
  USING (
    inviter_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    OR
    invitee_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Policy: Gig owners can send invitations
CREATE POLICY "Gig owners can send invitations"
  ON gig_invitations
  FOR INSERT
  WITH CHECK (
    -- Must be the gig owner
    inviter_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
    AND
    -- Gig must belong to the inviter
    EXISTS (
      SELECT 1 FROM gigs 
      WHERE id = gig_id 
      AND owner_user_id = inviter_id
    )
    AND
    -- Cannot invite yourself
    inviter_id != invitee_id
    AND
    -- Check if invitee accepts invitations
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = invitee_id
      AND allow_collaboration_invites = true
    )
  );

-- Policy: Invitees can update status (accept/decline)
CREATE POLICY "Invitees can respond to invitations"
  ON gig_invitations
  FOR UPDATE
  USING (
    invitee_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  )
  WITH CHECK (
    invitee_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Policy: Inviters can cancel invitations
CREATE POLICY "Inviters can cancel invitations"
  ON gig_invitations
  FOR UPDATE
  USING (
    inviter_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  )
  WITH CHECK (
    inviter_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Function to auto-apply when invitation is accepted
CREATE OR REPLACE FUNCTION handle_gig_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- If invitation was accepted, auto-create application
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Check if user hasn't already applied
    IF NOT EXISTS (
      SELECT 1 FROM applications 
      WHERE gig_id = NEW.gig_id 
      AND applicant_user_id = NEW.invitee_id
    ) THEN
      -- Create application
      INSERT INTO applications (
        gig_id,
        applicant_user_id,
        note,
        status,
        applied_at
      ) VALUES (
        NEW.gig_id,
        NEW.invitee_id,
        COALESCE(NEW.message, 'Applied via invitation'),
        'PENDING',
        NOW()
      );
    END IF;
    
    -- Update accepted_at timestamp
    NEW.accepted_at = NOW();
    NEW.responded_at = NOW();
  END IF;
  
  -- If declined, update responded_at
  IF NEW.status = 'declined' AND OLD.status = 'pending' THEN
    NEW.responded_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for invitation acceptance
CREATE TRIGGER trigger_handle_gig_invitation_acceptance
  BEFORE UPDATE ON gig_invitations
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION handle_gig_invitation_acceptance();

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_gig_invitations()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE gig_invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expire_old_gig_invitations IS 'Marks expired gig invitations as expired. Should be run periodically via cron job.';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON gig_invitations TO authenticated;
GRANT SELECT ON gig_invitations TO anon;

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'gig_invitations'
ORDER BY ordinal_position;

