-- Update moderation_actions table to support new bulk action types

-- Add new action types for bulk moderation
ALTER TABLE moderation_actions 
DROP CONSTRAINT moderation_actions_action_type_check;

ALTER TABLE moderation_actions 
ADD CONSTRAINT moderation_actions_action_type_check 
CHECK (action_type IN (
  'warning', 'suspension', 'ban', 'unban', 'content_remove', 
  'shadowban', 'unshadowban', 'verify', 'unverify',
  'bulk_approved', 'bulk_rejected', 'bulk_escalated',
  'approved', 'rejected', 'escalated'
));

-- Add new columns for enhanced tracking
ALTER TABLE moderation_actions 
ADD COLUMN IF NOT EXISTS content_id UUID,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update content_type constraint to include message and other content types
ALTER TABLE moderation_actions 
DROP CONSTRAINT IF EXISTS moderation_actions_content_type_check;

ALTER TABLE moderation_actions 
ADD CONSTRAINT moderation_actions_content_type_check 
CHECK (content_type IN (
  'user', 'gig', 'showcase', 'message', 'image', 'moodboard', 
  'profile', 'comment'
));

-- Create index for content lookups
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content 
ON moderation_actions(content_id, content_type) 
WHERE content_id IS NOT NULL;

-- Create index for bulk operations
CREATE INDEX IF NOT EXISTS idx_moderation_actions_bulk 
ON moderation_actions(action_type) 
WHERE action_type LIKE 'bulk_%';

-- Update the audit view to include the new fields
DROP VIEW IF EXISTS admin_moderation_audit;
CREATE OR REPLACE VIEW admin_moderation_audit AS
SELECT 
    ma.*,
    admin.display_name as admin_name,
    admin.handle as admin_handle,
    target.display_name as target_name,
    target.handle as target_handle,
    revoker.display_name as revoker_name,
    r.reason as report_reason,
    r.content_type as reported_content_type,
    -- Add content preview for moderation queue items
    CASE 
        WHEN ma.content_type = 'message' THEN 
            (SELECT LEFT(body, 100) FROM messages WHERE id = ma.content_id)
        ELSE NULL
    END as content_preview
FROM moderation_actions ma
LEFT JOIN users_profile admin ON ma.admin_user_id = admin.user_id
LEFT JOIN users_profile target ON ma.target_user_id = target.user_id
LEFT JOIN users_profile revoker ON ma.revoked_by = revoker.user_id
LEFT JOIN reports r ON ma.report_id = r.id
ORDER BY ma.created_at DESC;

-- Grant view access
GRANT SELECT ON admin_moderation_audit TO authenticated;

-- Create helper functions for moderation statistics
CREATE OR REPLACE FUNCTION get_moderation_action_stats()
RETURNS TABLE (
    total_actions INTEGER,
    actions_last_7_days INTEGER,
    actions_last_30_days INTEGER,
    most_common_action TEXT,
    avg_actions_per_admin NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_actions,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::INTEGER as actions_last_7_days,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::INTEGER as actions_last_30_days,
        (
            SELECT action_type 
            FROM moderation_actions 
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY action_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_common_action,
        (COUNT(*)::NUMERIC / NULLIF(COUNT(DISTINCT admin_user_id), 0))::NUMERIC(10,2) as avg_actions_per_admin
    FROM moderation_actions
    WHERE created_at >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_moderation_action_stats() TO authenticated;