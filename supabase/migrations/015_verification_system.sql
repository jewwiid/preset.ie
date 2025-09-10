-- Verification System
-- Handles identity and professional verification requests

-- Create verification_requests table
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT CHECK (verification_type IN ('identity', 'professional', 'business')) NOT NULL,
    document_urls TEXT[] NOT NULL,
    document_types TEXT[] NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'expired', 'additional_info_required')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review_notes TEXT,
    rejection_reason TEXT,
    additional_info_request TEXT,
    metadata JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure arrays match in length
    CONSTRAINT document_arrays_match CHECK (
        array_length(document_urls, 1) = array_length(document_types, 1)
    )
);

-- Create verification_badges table for awarded verifications
CREATE TABLE IF NOT EXISTS verification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT CHECK (badge_type IN ('verified_identity', 'verified_professional', 'verified_business')) NOT NULL,
    verification_request_id UUID REFERENCES verification_requests(id) ON DELETE SET NULL,
    issued_by UUID NOT NULL REFERENCES auth.users(id),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    revoke_reason TEXT
);

-- Create partial unique index for active badges
CREATE UNIQUE INDEX unique_active_badge_per_type 
ON verification_badges (user_id, badge_type) 
WHERE revoked_at IS NULL;

-- Create indexes
CREATE INDEX idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status) WHERE status IN ('pending', 'reviewing');
CREATE INDEX idx_verification_requests_type ON verification_requests(verification_type);
CREATE INDEX idx_verification_requests_submitted ON verification_requests(submitted_at DESC);
CREATE INDEX idx_verification_badges_user ON verification_badges(user_id);
CREATE INDEX idx_verification_badges_active ON verification_badges(user_id, badge_type) WHERE revoked_at IS NULL;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verification_updated_at_trigger
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_updated_at();

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
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_verified_identity,
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_professional'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_verified_professional,
        EXISTS (
            SELECT 1 FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_business'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
        ) as has_verified_business,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_identity'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        ) as identity_expires_at,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_professional'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
        ) as professional_expires_at,
        (
            SELECT expires_at FROM verification_badges
            WHERE user_id = p_user_id
            AND badge_type = 'verified_business'
            AND revoked_at IS NULL
            AND (expires_at IS NULL OR expires_at > NOW())
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
    
    -- Revoke any existing badge of the same type
    UPDATE verification_badges
    SET revoked_at = NOW(),
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
        expires_at
    ) VALUES (
        v_user_id,
        v_badge_type,
        p_request_id,
        p_reviewer_id,
        v_expires_at
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

-- Function to reject verification request
CREATE OR REPLACE FUNCTION reject_verification_request(
    p_request_id UUID,
    p_reviewer_id UUID,
    p_rejection_reason TEXT,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE verification_requests
    SET status = 'rejected',
        reviewed_by = p_reviewer_id,
        rejection_reason = p_rejection_reason,
        review_notes = p_review_notes,
        reviewed_at = NOW()
    WHERE id = p_request_id
    AND status IN ('pending', 'reviewing');
END;
$$ LANGUAGE plpgsql;

-- Function to expire old verifications
CREATE OR REPLACE FUNCTION expire_verifications()
RETURNS void AS $$
BEGIN
    -- Expire verification requests older than 30 days
    UPDATE verification_requests
    SET status = 'expired'
    WHERE status = 'pending'
    AND submitted_at < NOW() - INTERVAL '30 days';
    
    -- Remove verification flags from users with expired badges
    UPDATE users_profile up
    SET role_flags = array_remove(array_remove(role_flags, 'VERIFIED_ID'), 'VERIFIED_PRO')
    WHERE EXISTS (
        SELECT 1 FROM verification_badges vb
        WHERE vb.user_id = up.user_id
        AND vb.expires_at <= NOW()
        AND vb.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;

-- Verification Requests Policies
-- Admins can view all requests
CREATE POLICY admin_view_all_verification_requests ON verification_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Admins can update requests
CREATE POLICY admin_update_verification_requests ON verification_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Users can view their own requests
CREATE POLICY user_view_own_verification_requests ON verification_requests
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can create requests
CREATE POLICY user_create_verification_requests ON verification_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Verification Badges Policies
-- Anyone can view badges (public verification status)
CREATE POLICY public_view_badges ON verification_badges
    FOR SELECT
    USING (true);

-- Only admins can manage badges
CREATE POLICY admin_manage_badges ON verification_badges
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE user_id = auth.uid() AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Grant permissions
GRANT SELECT, INSERT ON verification_requests TO authenticated;
GRANT SELECT ON verification_badges TO authenticated;
GRANT ALL ON verification_requests TO service_role;
GRANT ALL ON verification_badges TO service_role;

-- Create admin dashboard view
CREATE OR REPLACE VIEW admin_verification_dashboard AS
SELECT 
    vr.*,
    u.display_name as user_name,
    u.handle as user_handle,
    au.email as user_email,
    reviewer.display_name as reviewer_name,
    (
        SELECT COUNT(*) FROM verification_badges
        WHERE user_id = vr.user_id
        AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    ) as active_badges_count,
    (
        SELECT COUNT(*) FROM verification_requests
        WHERE user_id = vr.user_id
        AND status = 'rejected'
    ) as previous_rejections
FROM verification_requests vr
LEFT JOIN users_profile u ON vr.user_id = u.user_id
LEFT JOIN auth.users au ON vr.user_id = au.id
LEFT JOIN users_profile reviewer ON vr.reviewed_by = reviewer.user_id
ORDER BY 
    CASE 
        WHEN vr.status = 'pending' THEN 1
        WHEN vr.status = 'reviewing' THEN 2
        ELSE 3
    END,
    vr.submitted_at DESC;

-- Grant view access
GRANT SELECT ON admin_verification_dashboard TO authenticated;