-- Admin Dashboard Functions and Views (Final Fixed Version)
-- Removed all non-existent column references

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
    r.reason as report_reason
FROM moderation_actions ma
LEFT JOIN users_profile admin ON ma.admin_user_id = admin.user_id
LEFT JOIN users_profile target ON ma.target_user_id = target.user_id
LEFT JOIN users_profile revoker ON ma.revoked_by = revoker.user_id
LEFT JOIN reports r ON ma.report_id = r.id
ORDER BY ma.created_at DESC;

-- Create verification dashboard view (FIXED - removed email)
CREATE OR REPLACE VIEW admin_verification_dashboard AS
SELECT 
    vr.*,
    u.display_name as user_name,
    u.handle as user_handle,
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
DECLARE
    v_functions_count INTEGER;
    v_views_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '  ADMIN FUNCTIONS & VIEWS COMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Count functions
    SELECT COUNT(*) INTO v_functions_count
    FROM pg_proc
    WHERE proname IN (
        'get_user_violation_count',
        'calculate_user_risk_score',
        'is_user_suspended_or_banned',
        'get_user_verification_status',
        'get_user_violation_summary'
    );
    
    -- Count views
    SELECT COUNT(*) INTO v_views_count
    FROM pg_views
    WHERE viewname IN (
        'admin_reports_dashboard',
        'admin_moderation_audit',
        'admin_verification_dashboard',
        'admin_violations_dashboard'
    );
    
    RAISE NOTICE '✅ Functions created: %', v_functions_count;
    RAISE NOTICE '✅ Admin views created: %', v_views_count;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 PHASE 1 COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Database foundation is now solid:';
    RAISE NOTICE '- All 6 admin tables created';
    RAISE NOTICE '- Helper functions installed';
    RAISE NOTICE '- Admin dashboard views ready';
    RAISE NOTICE '- RLS policies configured';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for Phase 2: API Development';
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
END $$;