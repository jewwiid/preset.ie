-- Reports System for Admin Dashboard
-- Handles user reports, content moderation, and safety violations

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
    reported_content_id UUID,
    content_type TEXT CHECK (content_type IN ('user', 'gig', 'showcase', 'message', 'image', 'moodboard')) NOT NULL,
    reason TEXT CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'scam', 'copyright', 'other', 'underage', 'safety')) NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    resolved_by UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolution_action TEXT CHECK (resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed', 'no_action')),
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    -- Add indexes for performance
    CONSTRAINT valid_content_reference CHECK (
        (content_type = 'user' AND reported_user_id IS NOT NULL) OR
        (content_type != 'user' AND reported_content_id IS NOT NULL)
    )
);

-- Create indexes for efficient querying
CREATE INDEX idx_reports_status ON reports(status) WHERE status != 'resolved';
CREATE INDEX idx_reports_priority ON reports(priority, created_at DESC) WHERE status IN ('pending', 'reviewing');
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id) WHERE reported_user_id IS NOT NULL;
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_content ON reports(content_type, reported_content_id) WHERE reported_content_id IS NOT NULL;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reports_updated_at_trigger
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_reports_updated_at();

-- Function to auto-escalate priority based on report count
CREATE OR REPLACE FUNCTION auto_escalate_report_priority()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
    recent_report_count INTEGER;
BEGIN
    -- Count total reports for this content/user
    IF NEW.reported_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM reports
        WHERE reported_user_id = NEW.reported_user_id
        AND status != 'dismissed';
        
        -- Count reports in last 24 hours
        SELECT COUNT(*) INTO recent_report_count
        FROM reports
        WHERE reported_user_id = NEW.reported_user_id
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status != 'dismissed';
    ELSIF NEW.reported_content_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM reports
        WHERE reported_content_id = NEW.reported_content_id
        AND content_type = NEW.content_type
        AND status != 'dismissed';
        
        SELECT COUNT(*) INTO recent_report_count
        FROM reports
        WHERE reported_content_id = NEW.reported_content_id
        AND content_type = NEW.content_type
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status != 'dismissed';
    END IF;
    
    -- Auto-escalate priority based on report frequency
    IF recent_report_count >= 5 OR report_count >= 10 THEN
        NEW.priority = 'critical';
    ELSIF recent_report_count >= 3 OR report_count >= 5 THEN
        NEW.priority = 'high';
    ELSIF report_count >= 2 THEN
        NEW.priority = 'medium';
    END IF;
    
    -- Safety and underage reports are always high priority
    IF NEW.reason IN ('underage', 'safety') THEN
        NEW.priority = 'critical';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_escalate_report_trigger
    BEFORE INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_escalate_report_priority();

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
    
    RETURN violation_count;
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
        (recent_reports * 20) + 
        (total_reports * 5) + 
        (resolved_violations * 15)
    );
    
    RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Admins can view all reports
CREATE POLICY admin_view_all_reports ON reports
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Admins can update reports
CREATE POLICY admin_update_reports ON reports
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Users can view their own reports (as reporter)
CREATE POLICY user_view_own_reports ON reports
    FOR SELECT
    USING (reporter_user_id = auth.uid());

-- Users can create reports
CREATE POLICY user_create_reports ON reports
    FOR INSERT
    WITH CHECK (reporter_user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT ON reports TO authenticated;
GRANT ALL ON reports TO service_role;

-- Create view for admin dashboard
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

-- Grant view access
GRANT SELECT ON admin_reports_dashboard TO authenticated;