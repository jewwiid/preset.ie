-- Complete Verification System Implementation
-- This migration implements all missing features for GDPR-compliant verification

-- 1. Update verification_requests table to include 'age' type and fix schema
ALTER TABLE verification_requests 
DROP CONSTRAINT IF EXISTS verification_requests_verification_type_check;

ALTER TABLE verification_requests 
ADD CONSTRAINT verification_requests_verification_type_check 
CHECK (verification_type IN ('age', 'identity', 'professional', 'business'));

-- 2. Add missing columns for enhanced verification
ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS request_type TEXT CHECK (request_type IN ('age', 'identity', 'professional', 'business')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Update verification_badges to include age verification
ALTER TABLE verification_badges 
DROP CONSTRAINT IF EXISTS verification_badges_badge_type_check;

ALTER TABLE verification_badges 
ADD CONSTRAINT verification_badges_badge_type_check 
CHECK (badge_type IN ('verified_age', 'verified_identity', 'verified_professional', 'verified_business'));

-- 4. Create verification documents bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents', 
    false, -- PRIVATE bucket for security
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 6. Storage policies for verification documents
CREATE POLICY IF NOT EXISTS "Users can upload verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Admins can view verification documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
        SELECT 1 FROM users_profile 
        WHERE user_id = auth.uid()
        AND 'ADMIN' = ANY(role_flags)
    )
);

CREATE POLICY IF NOT EXISTS "Users can view own verification documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Admins can delete verification documents"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'verification-documents'
    AND EXISTS (
        SELECT 1 FROM users_profile 
        WHERE user_id = auth.uid()
        AND 'ADMIN' = ANY(role_flags)
    )
);

-- 7. GDPR-compliant auto-cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_verification_documents()
RETURNS void AS $$
BEGIN
    -- Delete documents older than 30 days
    DELETE FROM storage.objects 
    WHERE bucket_id = 'verification-documents'
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Update verification requests to remove expired document URLs
    UPDATE verification_requests 
    SET document_url = NULL,
        admin_notes = COALESCE(admin_notes, '') || ' [Document auto-deleted after 30 days for GDPR compliance]'
    WHERE document_url IS NOT NULL
    AND submitted_at < NOW() - INTERVAL '30 days';
    
    -- Log cleanup activity
    INSERT INTO domain_events (event_type, event_data, created_at)
    VALUES (
        'verification_documents_cleaned',
        jsonb_build_object(
            'cleaned_at', NOW(),
            'reason', 'GDPR compliance - 30 day retention policy'
        ),
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Enhanced function to sync verified data to user profile
CREATE OR REPLACE FUNCTION sync_verified_data_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if verification was approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        -- Update user profile with verified information
        UPDATE users_profile 
        SET 
            verified_social_links = COALESCE(verified_social_links, '{}'::jsonb) || COALESCE(NEW.social_links, '{}'::jsonb),
            verified_professional_info = CASE 
                WHEN NEW.request_type = 'professional' THEN COALESCE(NEW.professional_info, '{}'::jsonb)
                ELSE verified_professional_info
            END,
            verified_business_info = CASE 
                WHEN NEW.request_type = 'business' THEN COALESCE(NEW.business_info, '{}'::jsonb)
                ELSE verified_business_info
            END,
            verification_badges = COALESCE(verification_badges, '{}'::jsonb) || 
                jsonb_build_object(NEW.request_type, jsonb_build_object(
                    'verified_at', NEW.reviewed_at,
                    'verified_by', NEW.reviewed_by,
                    'verification_id', NEW.id
                )),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Add verification flag to role_flags
        CASE NEW.request_type
            WHEN 'age' THEN
                UPDATE users_profile 
                SET role_flags = array_append(
                    array_remove(role_flags, 'VERIFIED_AGE'),
                    'VERIFIED_AGE'
                )
                WHERE user_id = NEW.user_id;
            WHEN 'identity' THEN
                UPDATE users_profile 
                SET role_flags = array_append(
                    array_remove(role_flags, 'VERIFIED_ID'),
                    'VERIFIED_ID'
                )
                WHERE user_id = NEW.user_id;
            WHEN 'professional' THEN
                UPDATE users_profile 
                SET role_flags = array_append(
                    array_remove(role_flags, 'VERIFIED_PRO'),
                    'VERIFIED_PRO'
                )
                WHERE user_id = NEW.user_id;
            WHEN 'business' THEN
                UPDATE users_profile 
                SET role_flags = array_append(
                    array_remove(role_flags, 'VERIFIED_BUSINESS'),
                    'VERIFIED_BUSINESS'
                )
                WHERE user_id = NEW.user_id;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to automatically sync verified data
DROP TRIGGER IF EXISTS sync_verified_data_trigger ON verification_requests;
CREATE TRIGGER sync_verified_data_trigger
    AFTER UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_verified_data_to_profile();

-- 10. Enhanced approval function with document deletion
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
    v_document_url TEXT;
BEGIN
    -- Get request details
    SELECT user_id, request_type, document_url 
    INTO v_user_id, v_verification_type, v_document_url
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
    
    -- GDPR COMPLIANCE: Delete document immediately after approval
    IF v_document_url IS NOT NULL THEN
        -- Delete from storage
        DELETE FROM storage.objects 
        WHERE bucket_id = 'verification-documents'
        AND name = v_document_url;
        
        -- Update record to remove document URL
        UPDATE verification_requests
        SET document_url = NULL,
            admin_notes = COALESCE(admin_notes, '') || ' [Document deleted after approval for GDPR compliance - ' || NOW() || ']'
        WHERE id = p_request_id;
    END IF;
    
    -- Revoke any existing badge of the same type
    UPDATE verification_badges
    SET revoked_at = NOW(),
        revoked_by = p_reviewer_id,
        revoke_reason = 'Superseded by new verification'
    WHERE user_id = v_user_id
    AND badge_type = v_badge_type
    AND revoked_at IS NULL;
    
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
    
    RETURN v_badge_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Enhanced rejection function with document deletion
CREATE OR REPLACE FUNCTION reject_verification_request(
    p_request_id UUID,
    p_reviewer_id UUID,
    p_rejection_reason TEXT,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_document_url TEXT;
BEGIN
    -- Get document URL before updating
    SELECT document_url INTO v_document_url
    FROM verification_requests
    WHERE id = p_request_id;
    
    -- Update request status
    UPDATE verification_requests
    SET status = 'rejected',
        reviewed_by = p_reviewer_id,
        rejection_reason = p_rejection_reason,
        review_notes = p_review_notes,
        reviewed_at = NOW()
    WHERE id = p_request_id
    AND status IN ('pending', 'reviewing');
    
    -- GDPR COMPLIANCE: Delete document immediately after rejection
    IF v_document_url IS NOT NULL THEN
        -- Delete from storage
        DELETE FROM storage.objects 
        WHERE bucket_id = 'verification-documents'
        AND name = v_document_url;
        
        -- Update record to remove document URL
        UPDATE verification_requests
        SET document_url = NULL,
            admin_notes = COALESCE(admin_notes, '') || ' [Document deleted after rejection for GDPR compliance - ' || NOW() || ']'
        WHERE id = p_request_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Function to expire old verifications (GDPR compliance)
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
    SET role_flags = array_remove(
        array_remove(
            array_remove(
                array_remove(role_flags, 'VERIFIED_AGE'), 
                'VERIFIED_ID'
            ), 
            'VERIFIED_PRO'
        ), 
        'VERIFIED_BUSINESS'
    )
    WHERE EXISTS (
        SELECT 1 FROM verification_badges vb
        WHERE vb.user_id = up.user_id
        AND vb.expires_at <= NOW()
        AND vb.revoked_at IS NULL
    );
    
    -- Clean up expired documents
    PERFORM cleanup_expired_verification_documents();
END;
$$ LANGUAGE plpgsql;

-- 13. Create admin dashboard view with enhanced data
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
    ) as previous_rejections,
    -- Data quality indicators
    CASE 
        WHEN vr.request_type = 'age' AND vr.document_url IS NOT NULL THEN 'complete'
        WHEN vr.request_type = 'identity' AND vr.document_url IS NOT NULL AND vr.social_links IS NOT NULL THEN 'complete'
        WHEN vr.request_type = 'professional' AND vr.document_url IS NOT NULL AND (vr.professional_info IS NOT NULL OR vr.social_links IS NOT NULL) THEN 'complete'
        WHEN vr.request_type = 'business' AND vr.document_url IS NOT NULL AND vr.business_info IS NOT NULL THEN 'complete'
        WHEN vr.document_url IS NOT NULL THEN 'partial'
        ELSE 'basic'
    END as data_quality
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

-- 14. Grant permissions
GRANT SELECT, INSERT ON verification_requests TO authenticated;
GRANT SELECT ON verification_badges TO authenticated;
GRANT ALL ON verification_requests TO service_role;
GRANT ALL ON verification_badges TO service_role;
GRANT SELECT ON admin_verification_dashboard TO authenticated;

-- 15. Add comments for documentation
COMMENT ON COLUMN verification_requests.verification_data IS 'Type-specific verification data (experience, specializations, etc.)';
COMMENT ON COLUMN verification_requests.social_links IS 'Social media links for identity verification';
COMMENT ON COLUMN verification_requests.professional_info IS 'Professional credentials and information';
COMMENT ON COLUMN verification_requests.business_info IS 'Business registration and details';
COMMENT ON COLUMN verification_requests.contact_info IS 'Additional contact information for verification';
COMMENT ON COLUMN verification_requests.document_url IS 'Path to verification document in secure storage (deleted after decision)';
COMMENT ON COLUMN verification_requests.admin_notes IS 'Admin notes including GDPR compliance actions';

COMMENT ON COLUMN users_profile.verified_social_links IS 'Verified social media links synced from approved verifications';
COMMENT ON COLUMN users_profile.verified_professional_info IS 'Verified professional information';
COMMENT ON COLUMN users_profile.verified_business_info IS 'Verified business information';
COMMENT ON COLUMN users_profile.verification_badges IS 'Verification badges and timestamps';

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_request_type ON verification_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_verification_requests_document_url ON verification_requests(document_url) WHERE document_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_verification_requests_verification_data ON verification_requests USING GIN (verification_data);
CREATE INDEX IF NOT EXISTS idx_verification_requests_social_links ON verification_requests USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_verification_requests_professional_info ON verification_requests USING GIN (professional_info);
CREATE INDEX IF NOT EXISTS idx_verification_requests_business_info ON verification_requests USING GIN (business_info);
CREATE INDEX IF NOT EXISTS idx_verification_requests_contact_info ON verification_requests USING GIN (contact_info);
CREATE INDEX IF NOT EXISTS idx_users_profile_verified_social_links ON users_profile USING GIN (verified_social_links);
CREATE INDEX IF NOT EXISTS idx_users_profile_verified_professional_info ON users_profile USING GIN (verified_professional_info);
CREATE INDEX IF NOT EXISTS idx_users_profile_verified_business_info ON users_profile USING GIN (verified_business_info);
CREATE INDEX IF NOT EXISTS idx_users_profile_verification_badges ON users_profile USING GIN (verification_badges);

-- 17. Schedule cleanup function (if pg_cron is available)
-- Note: This may need to be set up separately depending on Supabase plan
-- SELECT cron.schedule('cleanup-verification-docs', '0 2 * * *', 'SELECT cleanup_expired_verification_documents();');
-- SELECT cron.schedule('expire-verifications', '0 3 * * *', 'SELECT expire_verifications();');

-- 18. Log the migration
INSERT INTO domain_events (event_type, event_data, created_at)
VALUES (
    'verification_system_enhanced',
    jsonb_build_object(
        'migration_version', '040',
        'features_added', ARRAY[
            'age_verification_type',
            'enhanced_verification_fields',
            'gdpr_compliant_document_deletion',
            'automatic_data_sync',
            'secure_storage_policies',
            'admin_dashboard_enhancements'
        ],
        'compliance_features', ARRAY[
            'automatic_document_deletion',
            '30_day_retention_policy',
            'audit_trail',
            'data_minimization'
        ]
    ),
    NOW()
);
