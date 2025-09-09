-- Fix Admin Dashboard Migration
-- This ensures proper table structure before creating admin tables

-- ============================================
-- 0. FIX USERS_PROFILE TABLE
-- ============================================

-- First, check if users_profile exists and has proper structure
DO $$ 
BEGIN
    -- Check if user_id has unique constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_profile_user_id_key'
        AND conrelid = 'users_profile'::regclass
    ) THEN
        -- Add unique constraint on user_id if it doesn't exist
        ALTER TABLE users_profile ADD CONSTRAINT users_profile_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- ============================================
-- 1. REPORTS SYSTEM - Create or update
-- ============================================

-- Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL,
    reported_user_id UUID,
    reported_content_id UUID,
    content_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    resolved_by UUID,
    resolution_notes TEXT,
    resolution_action TEXT,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    -- Add reporter_user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_reporter_user_id_fkey'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_reporter_user_id_fkey 
            FOREIGN KEY (reporter_user_id) REFERENCES users_profile(user_id) ON DELETE CASCADE;
    END IF;
    
    -- Add reported_user_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_reported_user_id_fkey'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_reported_user_id_fkey 
            FOREIGN KEY (reported_user_id) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
    
    -- Add resolved_by foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_resolved_by_fkey'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_resolved_by_fkey 
            FOREIGN KEY (resolved_by) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraints
DO $$
BEGIN
    -- Add content_type check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_content_type_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_content_type_check 
            CHECK (content_type IN ('user', 'gig', 'showcase', 'message', 'image', 'moodboard'));
    END IF;
    
    -- Add reason check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_reason_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_reason_check 
            CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'scam', 'copyright', 'other', 'underage', 'safety'));
    END IF;
    
    -- Add status check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_status_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_status_check 
            CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed'));
    END IF;
    
    -- Add priority check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_priority_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_priority_check 
            CHECK (priority IN ('low', 'medium', 'high', 'critical'));
    END IF;
    
    -- Add resolution_action check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_resolution_action_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_resolution_action_check 
            CHECK (resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed', 'no_action'));
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status != 'resolved';
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority, created_at DESC) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id) WHERE reported_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- ============================================
-- 2. MODERATION ACTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    target_user_id UUID,
    target_content_id UUID,
    content_type TEXT,
    action_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    duration_hours INTEGER,
    expires_at TIMESTAMPTZ,
    report_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoke_reason TEXT
);

-- Add foreign keys for moderation_actions
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_actions_admin_user_id_fkey'
        AND conrelid = 'moderation_actions'::regclass
    ) THEN
        ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_admin_user_id_fkey 
            FOREIGN KEY (admin_user_id) REFERENCES users_profile(user_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_actions_target_user_id_fkey'
        AND conrelid = 'moderation_actions'::regclass
    ) THEN
        ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_target_user_id_fkey 
            FOREIGN KEY (target_user_id) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_actions_report_id_fkey'
        AND conrelid = 'moderation_actions'::regclass
    ) THEN
        ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_report_id_fkey 
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_actions_revoked_by_fkey'
        AND conrelid = 'moderation_actions'::regclass
    ) THEN
        ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_revoked_by_fkey 
            FOREIGN KEY (revoked_by) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraints for moderation_actions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_actions_action_type_check'
        AND conrelid = 'moderation_actions'::regclass
    ) THEN
        ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_action_type_check 
            CHECK (action_type IN ('warning', 'suspend', 'ban', 'unban', 'content_remove', 'shadowban', 'unshadowban', 'verify', 'unverify'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'moderation_actions_content_type_check'
        AND conrelid = 'moderation_actions'::regclass
    ) THEN
        ALTER TABLE moderation_actions ADD CONSTRAINT moderation_actions_content_type_check 
            CHECK (content_type IN ('user', 'gig', 'showcase', 'message', 'image', 'moodboard'));
    END IF;
END $$;

-- Create indexes for moderation
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin ON moderation_actions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user ON moderation_actions(target_user_id) WHERE target_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moderation_actions_type ON moderation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON moderation_actions(created_at DESC);

-- ============================================
-- 3. VERIFICATION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    verification_type TEXT NOT NULL,
    document_urls TEXT[] NOT NULL,
    document_types TEXT[] NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    review_notes TEXT,
    rejection_reason TEXT,
    additional_info_request TEXT,
    metadata JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign keys for verification_requests
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_requests_user_id_fkey'
        AND conrelid = 'verification_requests'::regclass
    ) THEN
        ALTER TABLE verification_requests ADD CONSTRAINT verification_requests_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users_profile(user_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_requests_reviewed_by_fkey'
        AND conrelid = 'verification_requests'::regclass
    ) THEN
        ALTER TABLE verification_requests ADD CONSTRAINT verification_requests_reviewed_by_fkey 
            FOREIGN KEY (reviewed_by) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraints for verification_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_requests_verification_type_check'
        AND conrelid = 'verification_requests'::regclass
    ) THEN
        ALTER TABLE verification_requests ADD CONSTRAINT verification_requests_verification_type_check 
            CHECK (verification_type IN ('identity', 'professional', 'business'));
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_requests_status_check'
        AND conrelid = 'verification_requests'::regclass
    ) THEN
        ALTER TABLE verification_requests ADD CONSTRAINT verification_requests_status_check 
            CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'expired', 'additional_info_required'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS verification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_type TEXT NOT NULL,
    verification_request_id UUID,
    issued_by UUID NOT NULL,
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoke_reason TEXT,
    is_active BOOLEAN GENERATED ALWAYS AS (
        revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
    ) STORED
);

-- Add foreign keys for verification_badges
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_badges_user_id_fkey'
        AND conrelid = 'verification_badges'::regclass
    ) THEN
        ALTER TABLE verification_badges ADD CONSTRAINT verification_badges_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users_profile(user_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_badges_issued_by_fkey'
        AND conrelid = 'verification_badges'::regclass
    ) THEN
        ALTER TABLE verification_badges ADD CONSTRAINT verification_badges_issued_by_fkey 
            FOREIGN KEY (issued_by) REFERENCES users_profile(user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_badges_verification_request_id_fkey'
        AND conrelid = 'verification_badges'::regclass
    ) THEN
        ALTER TABLE verification_badges ADD CONSTRAINT verification_badges_verification_request_id_fkey 
            FOREIGN KEY (verification_request_id) REFERENCES verification_requests(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'verification_badges_revoked_by_fkey'
        AND conrelid = 'verification_badges'::regclass
    ) THEN
        ALTER TABLE verification_badges ADD CONSTRAINT verification_badges_revoked_by_fkey 
            FOREIGN KEY (revoked_by) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes for verification
CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_verification_badges_user ON verification_badges(user_id);

-- ============================================
-- 4. USER VIOLATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS user_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    violation_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    report_id UUID,
    moderation_action_id UUID,
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN GENERATED ALWAYS AS (
        expires_at IS NULL OR expires_at > NOW()
    ) STORED
);

-- Add foreign keys for user_violations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_violations_user_id_fkey'
        AND conrelid = 'user_violations'::regclass
    ) THEN
        ALTER TABLE user_violations ADD CONSTRAINT user_violations_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users_profile(user_id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_violations_report_id_fkey'
        AND conrelid = 'user_violations'::regclass
    ) THEN
        ALTER TABLE user_violations ADD CONSTRAINT user_violations_report_id_fkey 
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_violations_moderation_action_id_fkey'
        AND conrelid = 'user_violations'::regclass
    ) THEN
        ALTER TABLE user_violations ADD CONSTRAINT user_violations_moderation_action_id_fkey 
            FOREIGN KEY (moderation_action_id) REFERENCES moderation_actions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraint for severity
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_violations_severity_check'
        AND conrelid = 'user_violations'::regclass
    ) THEN
        ALTER TABLE user_violations ADD CONSTRAINT user_violations_severity_check 
            CHECK (severity IN ('minor', 'moderate', 'severe', 'critical'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS violation_thresholds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    violation_count INTEGER NOT NULL UNIQUE,
    action_type TEXT NOT NULL,
    severity_threshold TEXT NOT NULL,
    auto_apply BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default thresholds
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
CREATE INDEX IF NOT EXISTS idx_user_violations_severity ON user_violations(severity);

-- ============================================
-- 5. ENABLE RLS
-- ============================================

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_thresholds ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS admin_view_all_reports ON reports;
DROP POLICY IF EXISTS admin_update_reports ON reports;
DROP POLICY IF EXISTS user_view_own_reports ON reports;
DROP POLICY IF EXISTS user_create_reports ON reports;
DROP POLICY IF EXISTS admin_view_all_actions ON moderation_actions;
DROP POLICY IF EXISTS admin_create_actions ON moderation_actions;
DROP POLICY IF EXISTS admin_view_all_verification_requests ON verification_requests;
DROP POLICY IF EXISTS user_view_own_verification_requests ON verification_requests;
DROP POLICY IF EXISTS public_view_badges ON verification_badges;
DROP POLICY IF EXISTS admin_view_all_violations ON user_violations;
DROP POLICY IF EXISTS user_view_own_violations ON user_violations;

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

-- Verification policies
CREATE POLICY admin_view_all_verification_requests ON verification_requests
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY user_view_own_verification_requests ON verification_requests
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY public_view_badges ON verification_badges
    FOR SELECT
    USING (true);

-- Violations policies
CREATE POLICY admin_view_all_violations ON user_violations
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

CREATE POLICY user_view_own_violations ON user_violations
    FOR SELECT
    USING (user_id = auth.uid());

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT ON reports TO authenticated;
GRANT SELECT ON moderation_actions TO authenticated;
GRANT SELECT, INSERT ON verification_requests TO authenticated;
GRANT SELECT ON verification_badges TO authenticated;
GRANT SELECT ON user_violations TO authenticated;
GRANT SELECT ON violation_thresholds TO authenticated;

-- ============================================
-- 8. VERIFICATION
-- ============================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Admin Dashboard Migration Status ===';
    RAISE NOTICE '';
    
    -- Check tables
    SELECT COUNT(*) INTO v_count FROM information_schema.tables 
    WHERE table_name IN ('reports', 'moderation_actions', 'verification_requests', 'verification_badges', 'user_violations', 'violation_thresholds');
    
    RAISE NOTICE 'Tables created: %', v_count;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        RAISE NOTICE '✅ Reports system ready';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_actions') THEN
        RAISE NOTICE '✅ Moderation system ready';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_requests') THEN
        RAISE NOTICE '✅ Verification system ready';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_violations') THEN
        RAISE NOTICE '✅ Violations tracking ready';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Admin dashboard tables are ready!';
    RAISE NOTICE '';
END $$;