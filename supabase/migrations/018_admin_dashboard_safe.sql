-- Safe Admin Dashboard Migration
-- This handles cases where some tables might already exist

-- ============================================
-- 1. REPORTS SYSTEM - Add missing columns if needed
-- ============================================

-- Check if reports table exists and add missing columns
DO $$ 
BEGIN
    -- Add priority column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='priority') THEN
        ALTER TABLE reports ADD COLUMN priority TEXT DEFAULT 'medium';
        ALTER TABLE reports ADD CONSTRAINT reports_priority_check 
            CHECK (priority IN ('low', 'medium', 'high', 'critical'));
    END IF;
    
    -- Add resolution_action column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='resolution_action') THEN
        ALTER TABLE reports ADD COLUMN resolution_action TEXT;
        ALTER TABLE reports ADD CONSTRAINT reports_resolution_action_check 
            CHECK (resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed', 'no_action'));
    END IF;
    
    -- Add evidence_urls column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='evidence_urls') THEN
        ALTER TABLE reports ADD COLUMN evidence_urls TEXT[];
    END IF;
    
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='updated_at') THEN
        ALTER TABLE reports ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add resolved_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='resolved_at') THEN
        ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for reports (IF NOT EXISTS handles existing ones)
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status != 'resolved';
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority, created_at DESC) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id) WHERE reported_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- 2. MODERATION ACTIONS - Create if not exists
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
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
    revoked_by UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
    revoke_reason TEXT,
    
    CONSTRAINT valid_target CHECK (
        target_user_id IS NOT NULL OR target_content_id IS NOT NULL
    )
);

-- Create indexes for moderation
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON moderation_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user ON moderation_actions(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON moderation_actions(created_at DESC);

-- ============================================
-- 3. VERIFICATION SYSTEM - Create if not exists
-- ============================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    verification_type TEXT CHECK (verification_type IN ('identity', 'professional', 'business')) NOT NULL,
    document_urls TEXT[] NOT NULL,
    document_types TEXT[] NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'expired', 'additional_info_required')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
    review_notes TEXT,
    rejection_reason TEXT,
    additional_info_request TEXT,
    metadata JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT document_arrays_match CHECK (
        array_length(document_urls, 1) = array_length(document_types, 1)
    )
);

CREATE TABLE IF NOT EXISTS verification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    badge_type TEXT CHECK (badge_type IN ('verified_identity', 'verified_professional', 'verified_business')) NOT NULL,
    verification_request_id UUID REFERENCES verification_requests(id) ON DELETE SET NULL,
    issued_by UUID NOT NULL REFERENCES users_profile(user_id),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
    revoke_reason TEXT,
    is_active BOOLEAN GENERATED ALWAYS AS (
        revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
    ) STORED
);

-- Create indexes for verification
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_verification_badges_user ON verification_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_badges_active ON verification_badges(user_id, is_active) WHERE is_active = true;

-- ============================================
-- 4. USER VIOLATIONS - Create if not exists
-- ============================================

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

CREATE TABLE IF NOT EXISTS violation_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_count INTEGER NOT NULL UNIQUE,
    action_type TEXT CHECK (action_type IN ('warning', 'suspend_24h', 'suspend_7d', 'suspend_30d', 'ban')) NOT NULL,
    severity_threshold TEXT CHECK (severity_threshold IN ('minor', 'moderate', 'severe', 'critical')) NOT NULL,
    auto_apply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default thresholds (only if not exists)
INSERT INTO violation_thresholds (violation_count, action_type, severity_threshold, auto_apply) VALUES
    (1, 'warning', 'minor', true),
    (2, 'warning', 'minor', true),
    (3, 'suspend_24h', 'minor', true),
    (5, 'suspend_7d', 'moderate', true),
    (7, 'suspend_30d', 'moderate', true),
    (10, 'ban', 'severe', false)
ON CONFLICT (violation_count) DO NOTHING;

-- Create indexes for violations
CREATE INDEX IF NOT EXISTS idx_user_violations_user ON user_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_violations_active ON user_violations(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_violations_severity ON user_violations(severity);

-- ============================================
-- 5. ENABLE RLS (safe to run multiple times)
-- ============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_thresholds ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES (drop and recreate)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS admin_view_all_reports ON reports;
DROP POLICY IF EXISTS admin_update_reports ON reports;
DROP POLICY IF EXISTS user_view_own_reports ON reports;
DROP POLICY IF EXISTS user_create_reports ON reports;
DROP POLICY IF EXISTS admin_view_all_actions ON moderation_actions;
DROP POLICY IF EXISTS admin_create_actions ON moderation_actions;
DROP POLICY IF EXISTS admin_update_actions ON moderation_actions;
DROP POLICY IF EXISTS user_view_own_actions ON moderation_actions;
DROP POLICY IF EXISTS admin_view_all_verification_requests ON verification_requests;
DROP POLICY IF EXISTS admin_update_verification_requests ON verification_requests;
DROP POLICY IF EXISTS user_view_own_verification_requests ON verification_requests;
DROP POLICY IF EXISTS user_create_verification_requests ON verification_requests;
DROP POLICY IF EXISTS public_view_badges ON verification_badges;
DROP POLICY IF EXISTS admin_manage_badges ON verification_badges;
DROP POLICY IF EXISTS admin_view_all_violations ON user_violations;
DROP POLICY IF EXISTS admin_manage_violations ON user_violations;
DROP POLICY IF EXISTS user_view_own_violations ON user_violations;
DROP POLICY IF EXISTS admin_manage_thresholds ON violation_thresholds;

-- Reports policies
CREATE POLICY admin_view_all_reports ON reports
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY admin_update_reports ON reports
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY user_view_own_reports ON reports
    FOR SELECT
    USING (reporter_user_id = auth.uid());

CREATE POLICY user_create_reports ON reports
    FOR INSERT
    WITH CHECK (reporter_user_id = auth.uid());

-- Moderation policies
CREATE POLICY admin_view_all_actions ON moderation_actions
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY admin_create_actions ON moderation_actions
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
        AND admin_user_id = auth.uid()
    );

CREATE POLICY admin_update_actions ON moderation_actions
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY user_view_own_actions ON moderation_actions
    FOR SELECT
    USING (target_user_id = auth.uid());

-- Verification policies
CREATE POLICY admin_view_all_verification_requests ON verification_requests
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY admin_update_verification_requests ON verification_requests
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY user_view_own_verification_requests ON verification_requests
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY user_create_verification_requests ON verification_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY public_view_badges ON verification_badges
    FOR SELECT
    USING (true);

CREATE POLICY admin_manage_badges ON verification_badges
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Violations policies
CREATE POLICY admin_view_all_violations ON user_violations
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY admin_manage_violations ON user_violations
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY user_view_own_violations ON user_violations
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY admin_manage_thresholds ON violation_thresholds
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT ON reports TO authenticated;
GRANT SELECT ON moderation_actions TO authenticated;
GRANT SELECT, INSERT ON verification_requests TO authenticated;
GRANT SELECT ON verification_badges TO authenticated;
GRANT SELECT ON user_violations TO authenticated;
GRANT SELECT ON violation_thresholds TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================
-- 8. VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Admin Dashboard Migration Complete ===';
    RAISE NOTICE '';
    
    -- Check reports table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        RAISE NOTICE '✅ Reports table configured';
    END IF;
    
    -- Check moderation_actions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_actions') THEN
        RAISE NOTICE '✅ Moderation actions table ready';
    END IF;
    
    -- Check verification tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_requests') THEN
        RAISE NOTICE '✅ Verification system ready';
    END IF;
    
    -- Check violations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_violations') THEN
        RAISE NOTICE '✅ Violations tracking ready';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Admin dashboard database setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test the tables with sample data';
    RAISE NOTICE '2. Continue with API development (Phase 2)';
    RAISE NOTICE '';
END $$;