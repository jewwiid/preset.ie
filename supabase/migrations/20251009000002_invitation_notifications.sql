-- Notification triggers for Gig and Collaboration Invitations
-- This migration creates triggers to automatically send notifications when invitations are sent or responded to

-- ============================================================================
-- GIG INVITATION NOTIFICATIONS
-- ============================================================================

-- Function to send notification when gig invitation is created
CREATE OR REPLACE FUNCTION notify_gig_invitation_sent()
RETURNS TRIGGER AS $$
DECLARE
  v_inviter_profile RECORD;
  v_invitee_user_id UUID;
  v_gig_title TEXT;
BEGIN
  -- Get inviter profile info
  SELECT 
    up.display_name,
    up.avatar_url,
    up.user_id
  INTO v_inviter_profile
  FROM users_profile up
  WHERE up.id = NEW.inviter_id;

  -- Get invitee user_id
  SELECT user_id INTO v_invitee_user_id
  FROM users_profile
  WHERE id = NEW.invitee_id;

  -- Get gig title
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Create notification for invitee
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_inviter_profile.user_id,
    v_invitee_user_id,
    'gig_invitation',
    'gig',
    'You''ve been invited to a gig!',
    v_inviter_profile.display_name || ' invited you to apply for "' || v_gig_title || '"',
    v_inviter_profile.avatar_url,
    '/dashboard/invitations?type=gigs',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'gig_id', NEW.gig_id,
      'inviter_id', NEW.inviter_id,
      'inviter_name', v_inviter_profile.display_name,
      'gig_title', v_gig_title
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when gig invitation is created
DROP TRIGGER IF EXISTS trigger_notify_gig_invitation_sent ON gig_invitations;
CREATE TRIGGER trigger_notify_gig_invitation_sent
  AFTER INSERT ON gig_invitations
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_gig_invitation_sent();


-- Function to send notification when gig invitation is accepted/declined
CREATE OR REPLACE FUNCTION notify_gig_invitation_response()
RETURNS TRIGGER AS $$
DECLARE
  v_invitee_profile RECORD;
  v_inviter_user_id UUID;
  v_gig_title TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only notify on status change to accepted or declined
  IF NEW.status NOT IN ('accepted', 'declined') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get invitee profile info
  SELECT 
    up.display_name,
    up.avatar_url
  INTO v_invitee_profile
  FROM users_profile up
  WHERE up.id = NEW.invitee_id;

  -- Get inviter user_id
  SELECT user_id INTO v_inviter_user_id
  FROM users_profile
  WHERE id = NEW.inviter_id;

  -- Get gig title
  SELECT title INTO v_gig_title
  FROM gigs
  WHERE id = NEW.gig_id;

  -- Set notification content based on response
  IF NEW.status = 'accepted' THEN
    v_notification_title := 'Gig invitation accepted!';
    v_notification_message := v_invitee_profile.display_name || ' accepted your invitation to "' || v_gig_title || '"';
  ELSE
    v_notification_title := 'Gig invitation declined';
    v_notification_message := v_invitee_profile.display_name || ' declined your invitation to "' || v_gig_title || '"';
  END IF;

  -- Create notification for inviter
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    (SELECT user_id FROM users_profile WHERE id = NEW.invitee_id),
    v_inviter_user_id,
    'gig_invitation_response',
    'gig',
    v_notification_title,
    v_notification_message,
    v_invitee_profile.avatar_url,
    '/gigs/' || NEW.gig_id,
    jsonb_build_object(
      'invitation_id', NEW.id,
      'gig_id', NEW.gig_id,
      'invitee_id', NEW.invitee_id,
      'invitee_name', v_invitee_profile.display_name,
      'gig_title', v_gig_title,
      'response', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when gig invitation is accepted/declined
DROP TRIGGER IF EXISTS trigger_notify_gig_invitation_response ON gig_invitations;
CREATE TRIGGER trigger_notify_gig_invitation_response
  AFTER UPDATE ON gig_invitations
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined'))
  EXECUTE FUNCTION notify_gig_invitation_response();


-- ============================================================================
-- COLLABORATION INVITATION NOTIFICATIONS
-- ============================================================================

-- Function to send notification when collaboration invitation is created
CREATE OR REPLACE FUNCTION notify_collab_invitation_sent()
RETURNS TRIGGER AS $$
DECLARE
  v_inviter_profile RECORD;
  v_invitee_user_id UUID;
  v_project_title TEXT;
  v_role_name TEXT;
BEGIN
  -- Get inviter profile info
  SELECT 
    up.display_name,
    up.avatar_url,
    up.user_id
  INTO v_inviter_profile
  FROM users_profile up
  WHERE up.id = NEW.inviter_id;

  -- Get invitee user_id (if invitee exists in system)
  IF NEW.invitee_id IS NOT NULL THEN
    SELECT user_id INTO v_invitee_user_id
    FROM users_profile
    WHERE id = NEW.invitee_id;
  ELSE
    -- Email invitation, skip notification for now
    -- TODO: Implement email notifications
    RETURN NEW;
  END IF;

  -- Get project title
  SELECT title INTO v_project_title
  FROM collab_projects
  WHERE id = NEW.project_id;

  -- Get role name if specified
  IF NEW.role_id IS NOT NULL THEN
    SELECT role_name INTO v_role_name
    FROM collab_roles
    WHERE id = NEW.role_id;
  END IF;

  -- Create notification for invitee
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    v_inviter_profile.user_id,
    v_invitee_user_id,
    'collab_invitation',
    'collaboration',
    'You''ve been invited to a project!',
    v_inviter_profile.display_name || ' invited you to join "' || v_project_title || '"' || 
      CASE WHEN v_role_name IS NOT NULL THEN ' as ' || v_role_name ELSE '' END,
    v_inviter_profile.avatar_url,
    '/dashboard/invitations?type=collabs',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'project_id', NEW.project_id,
      'inviter_id', NEW.inviter_id,
      'inviter_name', v_inviter_profile.display_name,
      'project_title', v_project_title,
      'role_name', v_role_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when collaboration invitation is created
DROP TRIGGER IF EXISTS trigger_notify_collab_invitation_sent ON collab_invitations;
CREATE TRIGGER trigger_notify_collab_invitation_sent
  AFTER INSERT ON collab_invitations
  FOR EACH ROW
  WHEN (NEW.status = 'pending' AND NEW.invitee_id IS NOT NULL)
  EXECUTE FUNCTION notify_collab_invitation_sent();


-- Function to send notification when collaboration invitation is accepted/declined
CREATE OR REPLACE FUNCTION notify_collab_invitation_response()
RETURNS TRIGGER AS $$
DECLARE
  v_invitee_profile RECORD;
  v_inviter_user_id UUID;
  v_project_title TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only notify on status change to accepted or declined
  IF NEW.status NOT IN ('accepted', 'declined') OR OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Skip if no invitee (email invitation)
  IF NEW.invitee_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get invitee profile info
  SELECT 
    up.display_name,
    up.avatar_url
  INTO v_invitee_profile
  FROM users_profile up
  WHERE up.id = NEW.invitee_id;

  -- Get inviter user_id
  SELECT user_id INTO v_inviter_user_id
  FROM users_profile
  WHERE id = NEW.inviter_id;

  -- Get project title
  SELECT title INTO v_project_title
  FROM collab_projects
  WHERE id = NEW.project_id;

  -- Set notification content based on response
  IF NEW.status = 'accepted' THEN
    v_notification_title := 'Project invitation accepted!';
    v_notification_message := v_invitee_profile.display_name || ' accepted your invitation to "' || v_project_title || '"';
  ELSE
    v_notification_title := 'Project invitation declined';
    v_notification_message := v_invitee_profile.display_name || ' declined your invitation to "' || v_project_title || '"';
  END IF;

  -- Create notification for inviter
  INSERT INTO notifications (
    user_id,
    recipient_id,
    type,
    category,
    title,
    message,
    avatar_url,
    action_url,
    data
  ) VALUES (
    (SELECT user_id FROM users_profile WHERE id = NEW.invitee_id),
    v_inviter_user_id,
    'collab_invitation_response',
    'collaboration',
    v_notification_title,
    v_notification_message,
    v_invitee_profile.avatar_url,
    '/collaborate/projects/' || NEW.project_id,
    jsonb_build_object(
      'invitation_id', NEW.id,
      'project_id', NEW.project_id,
      'invitee_id', NEW.invitee_id,
      'invitee_name', v_invitee_profile.display_name,
      'project_title', v_project_title,
      'response', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for when collaboration invitation is accepted/declined
DROP TRIGGER IF EXISTS trigger_notify_collab_invitation_response ON collab_invitations;
CREATE TRIGGER trigger_notify_collab_invitation_response
  AFTER UPDATE ON collab_invitations
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('accepted', 'declined'))
  EXECUTE FUNCTION notify_collab_invitation_response();


-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION notify_gig_invitation_sent() IS 'Sends notification when a gig invitation is created';
COMMENT ON FUNCTION notify_gig_invitation_response() IS 'Sends notification when a gig invitation is accepted or declined';
COMMENT ON FUNCTION notify_collab_invitation_sent() IS 'Sends notification when a collaboration invitation is created';
COMMENT ON FUNCTION notify_collab_invitation_response() IS 'Sends notification when a collaboration invitation is accepted or declined';

