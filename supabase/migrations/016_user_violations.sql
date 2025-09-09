-- User Violations System
-- Tracks violations and helps with progressive enforcement

-- Create user_violations table
CREATE TABLE IF NOT EXISTS user_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')) NOT NULL,
    report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
    moderation_action_id UUID REFERENCES moderation_actions(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN GENERATED ALWAYS AS (
        expires_at IS NULL OR expires_at > NOW()
    ) STORED
);

-- Create violation_thresholds table for progressive enforcement
CREATE TABLE IF NOT EXISTS violation_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_count INTEGER NOT NULL UNIQUE,
    action_type TEXT CHECK (action_type IN ('warning', 'suspend_24h', 'suspend_7d', 'suspend_30d', 'ban')) NOT NULL,
    severity_threshold TEXT CHECK (severity_threshold IN ('minor', 'moderate', 'severe', 'critical')) NOT NULL,
    auto_apply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default progressive enforcement thresholds
INSERT INTO violation_thresholds (violation_count, action_type, severity_threshold, auto_apply) VALUES
    (1, 'warning', 'minor', true),
    (2, 'warning', 'minor', true),
    (3, 'suspend_24h', 'minor', true),
    (5, 'suspend_7d', 'moderate', true),
    (7, 'suspend_30d', 'moderate', true),
    (10, 'ban', 'severe', false)
ON CONFLICT (violation_count) DO NOTHING;

-- Create indexes
CREATE INDEX idx_user_violations_user ON user_violations(user_id);
CREATE INDEX idx_user_violations_active ON user_violations(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_violations_severity ON user_violations(severity);
CREATE INDEX idx_user_violations_created ON user_violations(created_at DESC);
CREATE INDEX idx_user_violations_report ON user_violations(report_id) WHERE report_id IS NOT NULL;

-- Function to get user violation summary
CREATE OR REPLACE FUNCTION get_user_violation_summary(p_user_id UUID)
RETURNS TABLE (
    total_violations INTEGER,
    active_violations INTEGER,
    minor_count INTEGER,
    moderate_count INTEGER,
    severe_count INTEGER,
    critical_count INTEGER,
    last_violation_date TIMESTAMPTZ,
    risk_level TEXT
) AS $$
DECLARE
    v_risk_level TEXT;
    v_total INTEGER;
    v_severe_critical INTEGER;
BEGIN
    -- Get counts
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active) as active,
        COUNT(*) FILTER (WHERE severity = 'minor') as minor,
        COUNT(*) FILTER (WHERE severity = 'moderate') as moderate,
        COUNT(*) FILTER (WHERE severity = 'severe') as severe,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        MAX(created_at) as last_violation
    INTO 
        v_total,
        active_violations,
        minor_count,
        moderate_count,
        severe_count,
        critical_count,
        last_violation_date
    FROM user_violations
    WHERE user_id = p_user_id;
    
    total_violations := v_total;
    
    -- Calculate risk level
    v_severe_critical := severe_count + critical_count;
    
    IF v_severe_critical > 0 OR v_total >= 10 THEN
        v_risk_level := 'high';
    ELSIF moderate_count > 2 OR v_total >= 5 THEN
        v_risk_level := 'medium';
    ELSIF v_total > 0 THEN
        v_risk_level := 'low';
    ELSE
        v_risk_level := 'none';
    END IF;
    
    risk_level := v_risk_level;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to add violation and check for auto-enforcement
CREATE OR REPLACE FUNCTION add_user_violation(
    p_user_id UUID,
    p_violation_type TEXT,
    p_severity TEXT,
    p_description TEXT,
    p_report_id UUID DEFAULT NULL,
    p_evidence_urls TEXT[] DEFAULT NULL,
    p_expires_in_days INTEGER DEFAULT NULL
)
RETURNS TABLE (
    violation_id UUID,
    should_auto_enforce BOOLEAN,
    suggested_action TEXT,
    total_violations INTEGER
) AS $$
DECLARE
    v_violation_id UUID;
    v_total_violations INTEGER;
    v_expires_at TIMESTAMPTZ;
    v_suggested_action TEXT;
    v_should_enforce BOOLEAN := false;
BEGIN
    -- Calculate expiration
    IF p_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Insert violation
    INSERT INTO user_violations (
        user_id,
        violation_type,
        severity,
        description,
        report_id,
        evidence_urls,
        expires_at
    ) VALUES (
        p_user_id,
        p_violation_type,
        p_severity,
        p_description,
        p_report_id,
        p_evidence_urls,
        v_expires_at
    ) RETURNING id INTO v_violation_id;
    
    -- Count total active violations
    SELECT COUNT(*) INTO v_total_violations
    FROM user_violations
    WHERE user_id = p_user_id
    AND is_active = true;
    
    -- Check thresholds for auto-enforcement
    SELECT action_type, auto_apply INTO v_suggested_action, v_should_enforce
    FROM violation_thresholds
    WHERE violation_count <= v_total_violations
    AND severity_threshold <= p_severity
    ORDER BY violation_count DESC
    LIMIT 1;
    
    -- Return results
    violation_id := v_violation_id;
    should_auto_enforce := v_should_enforce;
    suggested_action := v_suggested_action;
    total_violations := v_total_violations;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to apply progressive enforcement
CREATE OR REPLACE FUNCTION apply_progressive_enforcement(
    p_user_id UUID,
    p_admin_id UUID,
    p_violation_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_violation_count INTEGER;
    v_action_type TEXT;
    v_duration_hours INTEGER;
    v_action_id UUID;
    v_severity TEXT;
BEGIN
    -- Get violation details
    SELECT severity INTO v_severity
    FROM user_violations
    WHERE id = p_violation_id;
    
    -- Count violations
    SELECT COUNT(*) INTO v_violation_count
    FROM user_violations
    WHERE user_id = p_user_id
    AND is_active = true;
    
    -- Determine action based on thresholds
    SELECT action_type INTO v_action_type
    FROM violation_thresholds
    WHERE violation_count <= v_violation_count
    AND severity_threshold <= v_severity
    AND auto_apply = true
    ORDER BY violation_count DESC
    LIMIT 1;
    
    -- Convert action type to duration
    CASE v_action_type
        WHEN 'suspend_24h' THEN v_duration_hours := 24;
        WHEN 'suspend_7d' THEN v_duration_hours := 168;
        WHEN 'suspend_30d' THEN v_duration_hours := 720;
        ELSE v_duration_hours := NULL;
    END CASE;
    
    -- Apply the action if determined
    IF v_action_type IS NOT NULL THEN
        IF v_action_type = 'warning' THEN
            -- Just log the warning
            INSERT INTO moderation_actions (
                admin_user_id,
                target_user_id,
                action_type,
                reason,
                metadata
            ) VALUES (
                p_admin_id,
                p_user_id,
                'warning',
                'Progressive enforcement: Violation #' || v_violation_count,
                jsonb_build_object('violation_id', p_violation_id, 'auto_applied', true)
            ) RETURNING id INTO v_action_id;
        ELSIF v_action_type LIKE 'suspend%' THEN
            -- Apply suspension
            v_action_id := apply_moderation_action(
                p_admin_id,
                'suspend',
                p_user_id,
                'Progressive enforcement: Violation #' || v_violation_count,
                v_duration_hours
            );
        ELSIF v_action_type = 'ban' THEN
            -- Apply ban (requires manual confirmation in our setup)
            v_action_id := NULL; -- Return null to indicate manual review needed
        END IF;
        
        -- Update violation with action reference
        IF v_action_id IS NOT NULL THEN
            UPDATE user_violations
            SET moderation_action_id = v_action_id
            WHERE id = p_violation_id;
        END IF;
    END IF;
    
    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old violations
CREATE OR REPLACE FUNCTION expire_old_violations()
RETURNS void AS $$
BEGIN
    -- Violations automatically expire via the GENERATED column
    -- This function can be used for any additional cleanup
    
    -- Log expiration events if needed
    INSERT INTO moderation_actions (
        admin_user_id,
        target_user_id,
        action_type,
        reason,
        metadata
    )
    SELECT 
        '00000000-0000-0000-0000-000000000000'::UUID, -- System user
        user_id,
        'warning',
        'Violations expired',
        jsonb_build_object(
            'expired_count', COUNT(*),
            'auto_generated', true
        )
    FROM user_violations
    WHERE expires_at <= NOW()
    AND expires_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_thresholds ENABLE ROW LEVEL SECURITY;

-- User Violations Policies
-- Admins can view all violations
CREATE POLICY admin_view_all_violations ON user_violations
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Admins can manage violations
CREATE POLICY admin_manage_violations ON user_violations
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Users can view their own violations
CREATE POLICY user_view_own_violations ON user_violations
    FOR SELECT
    USING (user_id = auth.uid());

-- Violation Thresholds Policies
-- Admins can view and manage thresholds
CREATE POLICY admin_manage_thresholds ON violation_thresholds
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Grant permissions
GRANT SELECT ON user_violations TO authenticated;
GRANT SELECT ON violation_thresholds TO authenticated;
GRANT ALL ON user_violations TO service_role;
GRANT ALL ON violation_thresholds TO service_role;

-- Create admin dashboard view
CREATE OR REPLACE VIEW admin_violations_dashboard AS
SELECT 
    uv.*,
    u.display_name as user_name,
    u.handle as user_handle,
    r.reason as report_reason,
    r.content_type as reported_content_type,
    ma.action_type as enforcement_action,
    ma.expires_at as enforcement_expires,
    (
        SELECT COUNT(*) FROM user_violations
        WHERE user_id = uv.user_id
        AND is_active = true
    ) as active_violation_count,
    get_user_violation_summary(uv.user_id) as violation_summary
FROM user_violations uv
LEFT JOIN users_profile u ON uv.user_id = u.user_id
LEFT JOIN reports r ON uv.report_id = r.id
LEFT JOIN moderation_actions ma ON uv.moderation_action_id = ma.id
ORDER BY uv.created_at DESC;

-- Grant view access
GRANT SELECT ON admin_violations_dashboard TO authenticated;

-- Create summary statistics view
CREATE OR REPLACE VIEW admin_violation_stats AS
SELECT 
    COUNT(*) as total_violations,
    COUNT(DISTINCT user_id) as unique_violators,
    COUNT(*) FILTER (WHERE severity = 'minor') as minor_violations,
    COUNT(*) FILTER (WHERE severity = 'moderate') as moderate_violations,
    COUNT(*) FILTER (WHERE severity = 'severe') as severe_violations,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_violations,
    COUNT(*) FILTER (WHERE is_active) as active_violations,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as violations_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as violations_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as violations_30d
FROM user_violations;

-- Grant view access
GRANT SELECT ON admin_violation_stats TO authenticated;