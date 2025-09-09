-- Admin Dashboard Functions and Views
-- These are the helper functions from the original migrations

-- ============================================
-- 1. REPORTS FUNCTIONS
-- ============================================

-- Function to get user violation count
CREATE OR REPLACE FUNCTION get_user_violation_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    violation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO violation_count
    FROM reports
    WHERE reported_user_id = p_user_id
    AND status = 'resolved'
    AND resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned');
    
    RETURN COALESCE(violation_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user risk score
CREATE OR REPLACE FUNCTION calculate_user_risk_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    recent_reports INTEGER;
    total_reports INTEGER;
    resolved_violations INTEGER;
BEGIN
    -- Recent reports (last 30 days)
    SELECT COUNT(*) INTO recent_reports
    FROM reports
    WHERE reported_user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days'
    AND status != 'dismissed';
    
    -- Total reports
    SELECT COUNT(*) INTO total_reports
    FROM reports
    WHERE reported_user_id = p_user_id
    AND status != 'dismissed';
    
    -- Resolved violations
    SELECT COUNT(*) INTO resolved_violations
    FROM reports
    WHERE reported_user_id = p_user_id
    AND status = 'resolved'
    AND resolution_action != 'dismissed';
    
    -- Calculate risk score (0-100)
    risk_score := LEAST(100, 
        (COALESCE(recent_reports, 0) * 20) + 
        (COALESCE(total_reports, 0) * 5) + 
        (COALESCE(resolved_violations, 0) * 15)
    );
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. MODERATION FUNCTIONS
-- ============================================

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

-- ============================================
-- 3. VERIFICATION FUNCTIONS
-- ============================================

-- Function to check user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(p_user_id UUID)
RETURNS TABLE (
    has_verified_identity BOOLEAN,
    has_verified_professional BOOLEAN,
    has_verified_business BOOLEAN,
    identity_expires_at TIMESTAMPTZ,
    professional_expires_at TIMESTAMPTZ,
    business_expires_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_identity'
            AND is_active = true
        ) as has_verified_identity,
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_professional'
            AND is_active = true
        ) as has_verified_professional,
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_business'
            AND is_active = true
        ) as has_verified_business,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_identity'
            AND is_active = true
            LIMIT 1
        ) as identity_expires_at,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_professional'
            AND is_active = true
            LIMIT 1
        ) as professional_expires_at,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_business'
            AND is_active = true
            LIMIT 1
        ) as business_expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to approve verification request
CREATE OR REPLACE FUNCTION approve_verification_request(
    p_request_id UUID,
    p_reviewer_id UUID,
    p_review_notes TEXT DEFAULT NULL,
    p_badge_expires_in_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_verification_type TEXT;
    v_badge_type TEXT;
    v_badge_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get request details
    SELECT user_id, verification_type INTO v_user_id, v_verification_type
    FROM verification_requests
    WHERE id = p_request_id
    AND status = 'pending';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Verification request not found or not pending';
    END IF;
    
    -- Determine badge type
    v_badge_type := 'verified_' || v_verification_type;
    
    -- Calculate expiration
    IF p_badge_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_badge_expires_in_days || ' days')::INTERVAL;
    END IF;
    
    -- Update request status
    UPDATE verification_requests
    SET status = 'approved',
        reviewed_by = p_reviewer_id,
        review_notes = p_review_notes,
        reviewed_at = NOW()
    WHERE id = p_request_id;
    
    -- Deactivate any existing badge of the same type
    UPDATE verification_badges
    SET is_active = false,
        revoked_at = NOW(),
        revoked_by = p_reviewer_id,
        revoke_reason = 'Superseded by new verification'
    WHERE user_id = v_user_id
    AND badge_type = v_badge_type
    AND is_active = true;
    
    -- Issue new badge
    INSERT INTO verification_badges (
        user_id,
        badge_type,
        verification_request_id,
        issued_by,
        expires_at,
        is_active
    ) VALUES (
        v_user_id,
        v_badge_type,
        p_request_id,
        p_reviewer_id,
        v_expires_at,
        true
    ) RETURNING id INTO v_badge_id;
    
    -- Update user profile with verification flag
    IF v_verification_type = 'identity' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'VERIFIED_ID'),
            'VERIFIED_ID'
        )
        WHERE user_id = v_user_id;
    ELSIF v_verification_type = 'professional' THEN
        UPDATE users_profile
        SET role_flags = array_append(
            array_remove(role_flags, 'VERIFIED_PRO'),
            'VERIFIED_PRO'
        )
        WHERE user_id = v_user_id;
    END IF;
    
    RETURN v_badge_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. VIOLATIONS FUNCTIONS
-- ============================================

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
    
    total_violations := COALESCE(v_total, 0);
    active_violations := COALESCE(active_violations, 0);
    minor_count := COALESCE(minor_count, 0);
    moderate_count := COALESCE(moderate_count, 0);
    severe_count := COALESCE(severe_count, 0);
    critical_count := COALESCE(critical_count, 0);
    
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

-- ============================================
-- 5. ADMIN DASHBOARD VIEWS
-- ============================================

-- Create view for admin reports dashboard
CREATE OR REPLACE VIEW admin_reports_dashboard AS
SELECT 
    r.*,
    reporter.display_name as reporter_name,
    reporter.handle as reporter_handle,
    reported.display_name as reported_name,
    reported.handle as reported_handle,
    resolver.display_name as resolver_name,
    get_user_violation_count(r.reported_user_id) as reported_user_violations,
    calculate_user_risk_score(r.reported_user_id) as reported_user_risk_score
FROM reports r
LEFT JOIN users_profile reporter ON r.reporter_user_id = reporter.user_id
LEFT JOIN users_profile reported ON r.reported_user_id = reported.user_id
LEFT JOIN users_profile resolver ON r.resolved_by = resolver.user_id;

-- Create audit view for moderation actions
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

-- Create verification dashboard view
CREATE OR REPLACE VIEW admin_verification_dashboard AS
SELECT 
    vr.*,
    u.display_name as user_name,
    u.handle as user_handle,
    u.email as user_email,
    reviewer.display_name as reviewer_name,
    (
        SELECT COUNT(*) FROM verification_badges
        WHERE user_id = vr.user_id
        AND is_active = true
    ) as active_badges_count,
    (
        SELECT COUNT(*) FROM verification_requests
        WHERE user_id = vr.user_id
        AND status = 'rejected'
    ) as previous_rejections
FROM verification_requests vr
LEFT JOIN users_profile u ON vr.user_id = u.user_id
LEFT JOIN users_profile reviewer ON vr.reviewed_by = reviewer.user_id
ORDER BY 
    CASE 
        WHEN vr.status = 'pending' THEN 1
        WHEN vr.status = 'reviewing' THEN 2
        ELSE 3
    END,
    vr.submitted_at DESC;

-- Create violations dashboard view  
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
    ) as active_violation_count
FROM user_violations uv
LEFT JOIN users_profile u ON uv.user_id = u.user_id
LEFT JOIN reports r ON uv.report_id = r.id
LEFT JOIN moderation_actions ma ON uv.moderation_action_id = ma.id
ORDER BY uv.created_at DESC;

-- Grant view access
GRANT SELECT ON admin_reports_dashboard TO authenticated;
GRANT SELECT ON admin_moderation_audit TO authenticated;
GRANT SELECT ON admin_verification_dashboard TO authenticated;
GRANT SELECT ON admin_violations_dashboard TO authenticated;

-- ============================================
-- 6. VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '  ADMIN FUNCTIONS CREATED';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Helper functions installed';
    RAISE NOTICE '✅ Admin views created';
    RAISE NOTICE '✅ Database fully configured';
    RAISE NOTICE '';
    RAISE NOTICE 'Phase 1 Complete! Ready for API development.';
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
END $$;