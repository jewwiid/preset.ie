-- Add Verification Functions and View
-- Run this AFTER add-verification-columns-only.sql
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Create enhanced sync function
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
                WHEN COALESCE(NEW.request_type, NEW.verification_type) = 'professional' THEN COALESCE(NEW.professional_info, '{}'::jsonb)
                ELSE verified_professional_info
            END,
            verified_business_info = CASE 
                WHEN COALESCE(NEW.request_type, NEW.verification_type) = 'business' THEN COALESCE(NEW.business_info, '{}'::jsonb)
                ELSE verified_business_info
            END,
            verification_badges = COALESCE(verification_badges, '{}'::jsonb) || 
                jsonb_build_object(COALESCE(NEW.request_type, NEW.verification_type), jsonb_build_object(
                    'verified_at', NEW.reviewed_at,
                    'verified_by', NEW.reviewed_by,
                    'verification_id', NEW.id
                )),
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Add verification flag to role_flags
        CASE COALESCE(NEW.request_type, NEW.verification_type)
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

-- 2. Create trigger to automatically sync verified data
DROP TRIGGER IF EXISTS sync_verified_data_trigger ON verification_requests;
CREATE TRIGGER sync_verified_data_trigger
    AFTER UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_verified_data_to_profile();

-- 3. Create GDPR-compliant cleanup function
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
END;
$$ LANGUAGE plpgsql;

-- 4. Create enhanced approval function with document deletion
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
    SELECT user_id, COALESCE(request_type, verification_type), document_url 
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

-- 5. Create enhanced rejection function with document deletion
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

-- 6. Drop and recreate admin dashboard view with enhanced data
DROP VIEW IF EXISTS admin_verification_dashboard;
CREATE VIEW admin_verification_dashboard AS
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
    -- Data quality indicators (using correct column names)
    CASE 
        WHEN COALESCE(vr.request_type, vr.verification_type) = 'age' AND (vr.document_url IS NOT NULL OR array_length(vr.document_urls, 1) > 0) THEN 'complete'
        WHEN COALESCE(vr.request_type, vr.verification_type) = 'identity' AND (vr.document_url IS NOT NULL OR array_length(vr.document_urls, 1) > 0) AND vr.social_links IS NOT NULL THEN 'complete'
        WHEN COALESCE(vr.request_type, vr.verification_type) = 'professional' AND (vr.document_url IS NOT NULL OR array_length(vr.document_urls, 1) > 0) AND (vr.professional_info IS NOT NULL OR vr.social_links IS NOT NULL) THEN 'complete'
        WHEN COALESCE(vr.request_type, vr.verification_type) = 'business' AND (vr.document_url IS NOT NULL OR array_length(vr.document_urls, 1) > 0) AND vr.business_info IS NOT NULL THEN 'complete'
        WHEN (vr.document_url IS NOT NULL OR array_length(vr.document_urls, 1) > 0) THEN 'partial'
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

-- 7. Grant permissions
GRANT SELECT ON admin_verification_dashboard TO authenticated;

-- Success message
SELECT 'Verification Functions and View Added Successfully!' as status;
