-- Final Admin Dashboard Migration
-- Handles existing tables and adds missing columns

-- ============================================
-- 0. ENSURE USERS_PROFILE HAS UNIQUE CONSTRAINT
-- ============================================

DO $$ 
BEGIN
    -- Add unique constraint on user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_profile_user_id_key'
        AND conrelid = 'users_profile'::regclass
    ) THEN
        ALTER TABLE users_profile ADD CONSTRAINT users_profile_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- ============================================
-- 1. FIX REPORTS TABLE
-- ============================================

-- Add missing columns to existing reports table
DO $$ 
BEGIN
    -- Add priority column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='priority') THEN
        ALTER TABLE reports ADD COLUMN priority TEXT DEFAULT 'medium';
    END IF;
    
    -- Add resolved_by column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='resolved_by') THEN
        ALTER TABLE reports ADD COLUMN resolved_by UUID;
    END IF;
    
    -- Add resolution_notes column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='resolution_notes') THEN
        ALTER TABLE reports ADD COLUMN resolution_notes TEXT;
    END IF;
    
    -- Add resolution_action column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='resolution_action') THEN
        ALTER TABLE reports ADD COLUMN resolution_action TEXT;
    END IF;
    
    -- Add evidence_urls column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='evidence_urls') THEN
        ALTER TABLE reports ADD COLUMN evidence_urls TEXT[];
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='updated_at') THEN
        ALTER TABLE reports ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add resolved_at column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='reports' AND column_name='resolved_at') THEN
        ALTER TABLE reports ADD COLUMN resolved_at TIMESTAMPTZ;
    END IF;
END $$;

-- Now add foreign key constraints after columns exist
DO $$ 
BEGIN
    -- Add resolved_by foreign key
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_resolved_by_fkey'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_resolved_by_fkey 
            FOREIGN KEY (resolved_by) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
    
    -- Add reporter_user_id foreign key if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_reporter_user_id_fkey'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_reporter_user_id_fkey 
            FOREIGN KEY (reporter_user_id) REFERENCES users_profile(user_id) ON DELETE CASCADE;
    END IF;
    
    -- Add reported_user_id foreign key if missing
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_reported_user_id_fkey'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_reported_user_id_fkey 
            FOREIGN KEY (reported_user_id) REFERENCES users_profile(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraints for reports
DO $$
BEGIN
    -- Priority check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_priority_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_priority_check 
            CHECK (priority IN ('low', 'medium', 'high', 'critical'));
    END IF;
    
    -- Resolution action check
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'reports_resolution_action_check'
        AND conrelid = 'reports'::regclass
    ) THEN
        ALTER TABLE reports ADD CONSTRAINT reports_resolution_action_check 
            CHECK (resolution_action IS NULL OR resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed', 'no_action'));
    END IF;
END $$;

-- Create indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status) WHERE status != 'resolved';
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority, created_at DESC) WHERE status IN ('pending', 'reviewing');
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id) WHERE reported_user_id IS NOT NULL;

-- ============================================
-- 2. CREATE MODERATION ACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS moderation_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users_profile(user_id) ON DELETE SET NULL,
    target_content_id UUID,
    content_type TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'suspend', 'ban', 'unban', 'content_remove', 'shadowban', 'unshadowban', 'verify', 'unverify')),
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

-- ============================================
-- 3. CREATE VERIFICATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'professional', 'business')),
    document_urls TEXT[] NOT NULL,
    document_types TEXT[] NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'expired', 'additional_info_required')),
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
    badge_type TEXT NOT NULL CHECK (badge_type IN ('verified_identity', 'verified_professional', 'verified_business')),
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

-- ============================================
-- 4. CREATE USER VIOLATIONS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS user_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users_profile(user_id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
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
    action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'suspend_24h', 'suspend_7d', 'suspend_30d', 'ban')),
    severity_threshold TEXT NOT NULL CHECK (severity_threshold IN ('minor', 'moderate', 'severe', 'critical')),
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
-- 6. CREATE RLS POLICIES
-- ============================================

-- Drop existing policies first
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

-- Create new policies

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
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to auto-escalate report priority
CREATE OR REPLACE FUNCTION auto_escalate_report_priority()
RETURNS TRIGGER AS $$
DECLARE
    report_count INTEGER;
BEGIN
    -- Count reports for this user/content in last 24 hours
    IF NEW.reported_user_id IS NOT NULL THEN
        SELECT COUNT(*) INTO report_count
        FROM reports
        WHERE reported_user_id = NEW.reported_user_id
        AND created_at > NOW() - INTERVAL '24 hours'
        AND status != 'dismissed';
        
        -- Auto-escalate based on frequency
        IF report_count >= 5 THEN
            NEW.priority = 'critical';
        ELSIF report_count >= 3 THEN
            NEW.priority = 'high';
        END IF;
    END IF;
    
    -- Safety and underage reports are always critical
    IF NEW.reason IN ('underage', 'safety') THEN
        NEW.priority = 'critical';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-escalation
DROP TRIGGER IF EXISTS auto_escalate_report_trigger ON reports;
CREATE TRIGGER auto_escalate_report_trigger
    BEFORE INSERT ON reports
    FOR EACH ROW
    EXECUTE FUNCTION auto_escalate_report_priority();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
DROP TRIGGER IF EXISTS reports_updated_at_trigger ON reports;
CREATE TRIGGER reports_updated_at_trigger
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS verification_requests_updated_at_trigger ON verification_requests;
CREATE TRIGGER verification_requests_updated_at_trigger
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 9. VERIFICATION AND STATUS
-- ============================================

DO $$
DECLARE
    v_tables_created INTEGER := 0;
    v_policies_created INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '  ADMIN DASHBOARD SETUP COMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    
    -- Count created tables
    SELECT COUNT(*) INTO v_tables_created
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('reports', 'moderation_actions', 'verification_requests', 
                       'verification_badges', 'user_violations', 'violation_thresholds');
    
    -- Count policies
    SELECT COUNT(*) INTO v_policies_created
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('reports', 'moderation_actions', 'verification_requests', 
                      'verification_badges', 'user_violations', 'violation_thresholds');
    
    RAISE NOTICE 'Tables created: %/6', v_tables_created;
    RAISE NOTICE 'Policies active: %', v_policies_created;
    RAISE NOTICE '';
    
    -- Check each table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reports') THEN
        RAISE NOTICE '✅ Reports system ready';
    ELSE
        RAISE NOTICE '❌ Reports table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'moderation_actions') THEN
        RAISE NOTICE '✅ Moderation system ready';
    ELSE
        RAISE NOTICE '❌ Moderation table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'verification_requests') THEN
        RAISE NOTICE '✅ Verification system ready';
    ELSE
        RAISE NOTICE '❌ Verification table missing';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_violations') THEN
        RAISE NOTICE '✅ Violations tracking ready';
    ELSE
        RAISE NOTICE '❌ Violations table missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Database setup complete!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test with sample data';
    RAISE NOTICE '2. Start API development (Phase 2)';
    RAISE NOTICE '3. Build UI components (Phase 3)';
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
END $$;