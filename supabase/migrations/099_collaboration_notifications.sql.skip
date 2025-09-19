-- =====================================================
-- COLLABORATION NOTIFICATIONS EXTENSION
-- =====================================================
-- Migration: 099_collaboration_notifications.sql
-- Description: Extend notification system for collaboration events
-- Dependencies: Existing notifications table, collaboration system

-- =====================================================
-- NOTIFICATION TYPES EXTENSION
-- =====================================================

-- Add collaboration-specific notification types to the enum
-- Note: This requires dropping and recreating the enum if it already exists
-- For safety, we'll add new notification types that don't conflict

-- Create new notification types for collaboration events
INSERT INTO notification_types (type, description, category) VALUES
('collab_project_published', 'New project published', 'collaboration'),
('collab_project_updated', 'Project updated', 'collaboration'),
('collab_role_application_received', 'New role application received', 'collaboration'),
('collab_role_application_accepted', 'Role application accepted', 'collaboration'),
('collab_role_application_rejected', 'Role application rejected', 'collaboration'),
('collab_gear_offer_received', 'New gear offer received', 'collaboration'),
('collab_gear_offer_accepted', 'Gear offer accepted', 'collaboration'),
('collab_gear_offer_rejected', 'Gear offer rejected', 'collaboration'),
('collab_match_found', 'New match found for your project', 'collaboration'),
('collab_participant_added', 'New participant added to project', 'collaboration'),
('collab_project_started', 'Project started', 'collaboration'),
('collab_project_completed', 'Project completed', 'collaboration'),
('collab_project_cancelled', 'Project cancelled', 'collaboration')
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to create collaboration notifications
CREATE OR REPLACE FUNCTION create_collaboration_notification(
  p_user_id UUID,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    type,
    metadata,
    read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_metadata,
    FALSE,
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to notify project participants
CREATE OR REPLACE FUNCTION notify_project_participants(
  p_project_id UUID,
  p_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  participant_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Get all participants except the excluded user
  FOR participant_record IN
    SELECT user_id
    FROM collab_participants
    WHERE project_id = p_project_id
    AND user_id != COALESCE(p_exclude_user_id, '00000000-0000-0000-0000-000000000000'::UUID)
  LOOP
    -- Create notification for each participant
    PERFORM create_collaboration_notification(
      participant_record.user_id,
      p_type,
      p_metadata
    );
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COLLABORATION TRIGGERS
-- =====================================================

-- Trigger function for project publication notifications
CREATE OR REPLACE FUNCTION trigger_project_publication_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify when project status changes to 'published'
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    -- Notify users who might be interested in this project
    -- This would typically involve matching users based on skills, location, etc.
    -- For now, we'll create a notification for the creator
    PERFORM create_collaboration_notification(
      NEW.creator_id,
      'collab_project_published',
      jsonb_build_object(
        'project_id', NEW.id,
        'project_title', NEW.title,
        'project_city', NEW.city,
        'project_country', NEW.country
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for project publication
CREATE TRIGGER project_publication_notification_trigger
  AFTER UPDATE ON collab_projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_project_publication_notification();

-- Trigger function for role application notifications
CREATE OR REPLACE FUNCTION trigger_role_application_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_creator_id UUID;
BEGIN
  -- Get project creator
  SELECT creator_id INTO project_creator_id
  FROM collab_projects
  WHERE id = NEW.project_id;
  
  -- Notify project creator of new application
  PERFORM create_collaboration_notification(
    project_creator_id,
    'collab_role_application_received',
    jsonb_build_object(
      'application_id', NEW.id,
      'project_id', NEW.project_id,
      'role_id', NEW.role_id,
      'applicant_id', NEW.applicant_id,
      'application_type', NEW.application_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for role applications
CREATE TRIGGER role_application_notification_trigger
  AFTER INSERT ON collab_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_role_application_notification();

-- Trigger function for application status changes
CREATE OR REPLACE FUNCTION trigger_application_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes
  IF NEW.status != OLD.status THEN
    -- Notify applicant of status change
    PERFORM create_collaboration_notification(
      NEW.applicant_id,
      CASE NEW.status
        WHEN 'accepted' THEN 'collab_role_application_accepted'
        WHEN 'rejected' THEN 'collab_role_application_rejected'
        ELSE 'collab_role_application_received'
      END,
      jsonb_build_object(
        'application_id', NEW.id,
        'project_id', NEW.project_id,
        'role_id', NEW.role_id,
        'status', NEW.status
      )
    );
    
    -- If accepted, notify project participants
    IF NEW.status = 'accepted' THEN
      PERFORM notify_project_participants(
        NEW.project_id,
        'collab_participant_added',
        jsonb_build_object(
          'participant_id', NEW.applicant_id,
          'role_id', NEW.role_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for application status changes
CREATE TRIGGER application_status_notification_trigger
  AFTER UPDATE ON collab_applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_application_status_notification();

-- Trigger function for gear offer notifications
CREATE OR REPLACE FUNCTION trigger_gear_offer_notification()
RETURNS TRIGGER AS $$
DECLARE
  project_creator_id UUID;
BEGIN
  -- Get project creator
  SELECT creator_id INTO project_creator_id
  FROM collab_projects
  WHERE id = NEW.project_id;
  
  -- Notify project creator of new gear offer
  PERFORM create_collaboration_notification(
    project_creator_id,
    'collab_gear_offer_received',
    jsonb_build_object(
      'offer_id', NEW.id,
      'project_id', NEW.project_id,
      'gear_request_id', NEW.gear_request_id,
      'offerer_id', NEW.offerer_id,
      'listing_id', NEW.listing_id,
      'offer_type', NEW.offer_type
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for gear offers
CREATE TRIGGER gear_offer_notification_trigger
  AFTER INSERT ON collab_gear_offers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gear_offer_notification();

-- Trigger function for gear offer status changes
CREATE OR REPLACE FUNCTION trigger_gear_offer_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes
  IF NEW.status != OLD.status THEN
    -- Notify offerer of status change
    PERFORM create_collaboration_notification(
      NEW.offerer_id,
      CASE NEW.status
        WHEN 'accepted' THEN 'collab_gear_offer_accepted'
        WHEN 'rejected' THEN 'collab_gear_offer_rejected'
        ELSE 'collab_gear_offer_received'
      END,
      jsonb_build_object(
        'offer_id', NEW.id,
        'project_id', NEW.project_id,
        'gear_request_id', NEW.gear_request_id,
        'status', NEW.status
      )
    );
    
    -- If accepted, notify project participants
    IF NEW.status = 'accepted' THEN
      PERFORM notify_project_participants(
        NEW.project_id,
        'collab_participant_added',
        jsonb_build_object(
          'participant_id', NEW.offerer_id,
          'participant_type', 'equipment_provider'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for gear offer status changes
CREATE TRIGGER gear_offer_status_notification_trigger
  AFTER UPDATE ON collab_gear_offers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gear_offer_status_notification();

-- Trigger function for project status changes
CREATE OR REPLACE FUNCTION trigger_project_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_type TEXT;
BEGIN
  -- Only process when status changes
  IF NEW.status != OLD.status THEN
    -- Determine notification type based on new status
    notification_type := CASE NEW.status
      WHEN 'in_progress' THEN 'collab_project_started'
      WHEN 'completed' THEN 'collab_project_completed'
      WHEN 'cancelled' THEN 'collab_project_cancelled'
      ELSE NULL
    END;
    
    -- Notify all participants if status changed to a significant state
    IF notification_type IS NOT NULL THEN
      PERFORM notify_project_participants(
        NEW.id,
        notification_type,
        jsonb_build_object(
          'project_id', NEW.id,
          'project_title', NEW.title,
          'status', NEW.status
        ),
        NEW.creator_id -- Exclude creator from notification
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for project status changes
CREATE TRIGGER project_status_notification_trigger
  AFTER UPDATE ON collab_projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_project_status_notification();

-- =====================================================
-- NOTIFICATION QUERIES AND HELPERS
-- =====================================================

-- Function to get collaboration notifications for a user
CREATE OR REPLACE FUNCTION get_collaboration_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  metadata JSONB,
  read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.metadata,
    n.read,
    n.created_at
  FROM notifications n
  WHERE n.user_id = p_user_id
  AND n.type LIKE 'collab_%'
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Function to mark collaboration notifications as read
CREATE OR REPLACE FUNCTION mark_collaboration_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all collaboration notifications as read
    UPDATE notifications
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id
    AND type LIKE 'collab_%'
    AND read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id
    AND id = ANY(p_notification_ids)
    AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_collaboration_notification(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION notify_project_participants(UUID, TEXT, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_collaboration_notifications(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_collaboration_notifications_read(UUID, UUID[]) TO authenticated;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION create_collaboration_notification IS 'Create a collaboration notification for a user';
COMMENT ON FUNCTION notify_project_participants IS 'Notify all participants of a project about an event';
COMMENT ON FUNCTION get_collaboration_notifications IS 'Get collaboration notifications for a user';
COMMENT ON FUNCTION mark_collaboration_notifications_read IS 'Mark collaboration notifications as read';

COMMENT ON TRIGGER project_publication_notification_trigger ON collab_projects IS 'Notify when project is published';
COMMENT ON TRIGGER role_application_notification_trigger ON collab_applications IS 'Notify when role application is received';
COMMENT ON TRIGGER application_status_notification_trigger ON collab_applications IS 'Notify when application status changes';
COMMENT ON TRIGGER gear_offer_notification_trigger ON collab_gear_offers IS 'Notify when gear offer is received';
COMMENT ON TRIGGER gear_offer_status_notification_trigger ON collab_gear_offers IS 'Notify when gear offer status changes';
COMMENT ON TRIGGER project_status_notification_trigger ON collab_projects IS 'Notify when project status changes';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log successful migration
INSERT INTO system_alerts (type, level, message, metadata)
VALUES (
    'migration_completed',
    'info',
    'Collaboration notifications extension completed successfully',
    '{"migration": "099_collaboration_notifications.sql", "notification_types_added": 13, "functions_created": 6, "triggers_created": 6}'
) ON CONFLICT DO NOTHING;
