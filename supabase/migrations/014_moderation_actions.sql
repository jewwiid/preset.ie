-- Moderation Actions System
-- Tracks all moderation actions taken by admins

-- Create moderation_actions table
CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_content_id UUID,
    content_type TEXT CHECK (content_type IN ('user', 'gig', 'showcase', 'message', 'image', 'moodboard')),
    action_type TEXT CHECK (action_type IN ('warning', 'suspend', 'ban', 'unban', 'content_remove', 'shadowban', 'unshadowban', 'verify', 'unverify')) NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INTEGER,
    expires_at TIMESTAMPTZ,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoke_reason TEXT,
    
    -- Ensure we have a target
    CONSTRAINT valid_target CHECK (
        target_user_id IS NOT NULL OR target_content_id IS NOT NULL
    )
);

-- Create indexes
CREATE INDEX idx_moderation_actions_admin ON moderation_actions(admin_user_id);
CREATE INDEX idx_moderation_actions_target_user ON moderation_actions(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX idx_moderation_actions_type ON moderation_actions(action_type);
CREATE INDEX idx_moderation_actions_created ON moderation_actions(created_at DESC);
CREATE INDEX idx_moderation_actions_expires ON moderation_actions(expires_at) WHERE expires_at IS NOT NULL AND revoked_at IS NULL;
CREATE INDEX idx_moderation_actions_report ON moderation_actions(report_id) WHERE report_id IS NOT NULL;

-- Function to check if user is currently suspended/banned
CREATE OR REPLACE FUNCTION is_user_suspended_or_banned(p_user_id UUID)
RETURNS TABLE (
    is_suspended BOOLEAN,
    is_banned BOOLEAN,
    suspension_expires_at TIMESTAMPTZ,
    ban_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT 1 FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'suspend'
            AND (expires_at IS NULL OR expires_at > NOW())
            AND revoked_at IS NULL
        ) as is_suspended,
        EXISTS (
            SELECT 1 FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'ban'
            AND revoked_at IS NULL
        ) as is_banned,
        (
            SELECT expires_at FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'suspend'
            AND (expires_at IS NULL OR expires_at > NOW())
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ) as suspension_expires_at,
        (
            SELECT reason FROM moderation_actions
            WHERE target_user_id = p_user_id
            AND action_type = 'ban'
            AND revoked_at IS NULL
            ORDER BY created_at DESC
            LIMIT 1
        ) as ban_reason;
END;
$$ LANGUAGE plpgsql;

-- Function to apply moderation action
CREATE OR REPLACE FUNCTION apply_moderation_action(
    p_admin_id UUID,
    p_action_type TEXT,
    p_target_user_id UUID,
    p_reason TEXT,
    p_duration_hours INTEGER DEFAULT NULL,
    p_report_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_action_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Calculate expiration if duration provided
    IF p_duration_hours IS NOT NULL THEN
        v_expires_at := NOW() + (p_duration_hours || ' hours')::INTERVAL;
    END IF;
    
    -- Revoke any existing actions of the same type if this is ban/unban
    IF p_action_type IN ('ban', 'unban') THEN
        UPDATE moderation_actions
        SET revoked_at = NOW(),
            revoked_by = p_admin_id,
            revoke_reason = 'Superseded by new ' || p_action_type
        WHERE target_user_id = p_target_user_id
        AND action_type IN ('ban', 'suspend')
        AND revoked_at IS NULL;
    END IF;
    
    -- Insert new action
    INSERT INTO moderation_actions (
        admin_user_id,
        target_user_id,
        action_type,
        reason,
        duration_hours,
        expires_at,
        report_id
    ) VALUES (
        p_admin_id,
        p_target_user_id,
        p_action_type,
        p_reason,
        p_duration_hours,
        v_expires_at,
        p_report_id
    ) RETURNING id INTO v_action_id;
    
    -- Update user profile flags based on action
    IF p_action_type = 'ban' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'BANNED'),
            'BANNED'
        )
        WHERE user_id = p_target_user_id;
    ELSIF p_action_type = 'unban' THEN
        UPDATE users_profile
        SET role_flags = array_remove(role_flags, 'BANNED')
        WHERE user_id = p_target_user_id;
    ELSIF p_action_type = 'shadowban' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'SHADOWBANNED'),
            'SHADOWBANNED'
        )
        WHERE user_id = p_target_user_id;
    ELSIF p_action_type = 'unshadowban' THEN
        UPDATE users_profile
        SET role_flags = array_remove(role_flags, 'SHADOWBANNED')
        WHERE user_id = p_target_user_id;
    END IF;
    
    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire suspensions
CREATE OR REPLACE FUNCTION expire_suspensions()
RETURNS void AS $$
BEGIN
    UPDATE moderation_actions
    SET revoked_at = NOW(),
        revoke_reason = 'Suspension period expired'
    WHERE action_type = 'suspend'
    AND expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- Admins can view all actions
CREATE POLICY admin_view_all_actions ON moderation_actions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Admins can create actions
CREATE POLICY admin_create_actions ON moderation_actions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
        AND admin_user_id = auth.uid()
    );

-- Admins can update actions (for revoking)
CREATE POLICY admin_update_actions ON moderation_actions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Users can view their own moderation history
CREATE POLICY user_view_own_actions ON moderation_actions
    FOR SELECT
    USING (target_user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON moderation_actions TO authenticated;
GRANT ALL ON moderation_actions TO service_role;

-- Create audit view for admin dashboard
CREATE OR REPLACE VIEW admin_moderation_audit AS
SELECT 
    ma.*,
    admin.display_name as admin_name,
    admin.handle as admin_handle,
    target.display_name as target_name,
    target.handle as target_handle,
    revoker.display_name as revoker_name,
    r.reason as report_reason,
    r.content_type as reported_content_type
FROM moderation_actions ma
LEFT JOIN users_profile admin ON ma.admin_user_id = admin.user_id
LEFT JOIN users_profile target ON ma.target_user_id = target.user_id
LEFT JOIN users_profile revoker ON ma.revoked_by = revoker.user_id
LEFT JOIN reports r ON ma.report_id = r.id
ORDER BY ma.created_at DESC;

-- Grant view access
GRANT SELECT ON admin_moderation_audit TO authenticated;

-- Create a scheduled job to expire suspensions (run every hour)
-- Note: This would be run via a cron job or Supabase Edge Function
-- SELECT cron.schedule('expire-suspensions', '0 * * * *', 'SELECT expire_suspensions();');