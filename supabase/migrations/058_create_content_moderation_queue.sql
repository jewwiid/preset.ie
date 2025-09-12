-- Create content_moderation_queue view/table if it doesn't exist
-- This ensures compatibility with the updated API endpoints

-- Create the content_moderation_queue as an alias/view of moderation_queue
-- OR create it as a separate table if needed

-- Option 1: Create as a view (recommended for compatibility)
CREATE OR REPLACE VIEW content_moderation_queue AS
SELECT 
    id,
    content_id,
    content_type,
    content_text,
    user_id,
    flagged_reason,
    severity_score,
    status,
    reviewer_id as resolved_by,
    auto_flagged_at as created_at,
    reviewed_at as resolved_at,
    resolution_notes as admin_notes,
    metadata,
    updated_at,
    -- Add user info via join
    (SELECT display_name FROM users_profile WHERE user_id = moderation_queue.user_id) as user_name,
    (SELECT handle FROM users_profile WHERE user_id = moderation_queue.user_id) as user_handle
FROM moderation_queue;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE ON content_moderation_queue TO authenticated;
GRANT ALL ON content_moderation_queue TO service_role;

-- Enable RLS on the view (if supported)
-- ALTER VIEW content_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for the view
-- Copy policies from moderation_queue
CREATE OR REPLACE RULE content_moderation_queue_insert AS
    ON INSERT TO content_moderation_queue
    DO INSTEAD
    INSERT INTO moderation_queue (
        content_id, content_type, content_text, user_id, 
        flagged_reason, severity_score, status
    )
    VALUES (
        NEW.content_id, NEW.content_type, NEW.content_text, NEW.user_id,
        NEW.flagged_reason, NEW.severity_score, NEW.status
    );

CREATE OR REPLACE RULE content_moderation_queue_update AS
    ON UPDATE TO content_moderation_queue
    DO INSTEAD
    UPDATE moderation_queue SET
        status = NEW.status,
        resolved_by = NEW.resolved_by,
        resolved_at = NEW.resolved_at,
        admin_notes = NEW.admin_notes,
        updated_at = NOW()
    WHERE id = OLD.id;

-- Create helper functions for statistics that work with the correct table names
CREATE OR REPLACE FUNCTION get_average_severity()
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(AVG(severity_score), 0)
        FROM moderation_queue 
        WHERE severity_score IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_violation_flags()
RETURNS TABLE (flag TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        unnest(flagged_reason) as flag,
        COUNT(*)::BIGINT as count
    FROM moderation_queue 
    WHERE flagged_reason IS NOT NULL 
    GROUP BY unnest(flagged_reason)
    ORDER BY count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_average_resolution_time()
RETURNS NUMERIC AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            AVG(EXTRACT(EPOCH FROM (reviewed_at - auto_flagged_at)) / 3600), 
            0
        )
        FROM moderation_queue 
        WHERE reviewed_at IS NOT NULL 
        AND auto_flagged_at IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_average_severity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_violation_flags() TO authenticated;  
GRANT EXECUTE ON FUNCTION get_average_resolution_time() TO authenticated;