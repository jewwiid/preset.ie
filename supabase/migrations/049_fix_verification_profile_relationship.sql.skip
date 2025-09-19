-- Fix Verification-Profile Relationship
-- This migration fixes the foreign key relationship between verification_requests and users_profile

-- The issue: verification_requests.user_id references auth.users(id) but the frontend 
-- expects to join with users_profile table. We need to add a proper relationship.

-- Since users_profile.user_id already references auth.users.id, and verification_requests.user_id
-- also references auth.users.id, we can use this transitivity to create a view or adjust the FK.

-- Option 1: Add a direct foreign key constraint (but this would be redundant)
-- Since verification_requests.user_id = auth.users.id and users_profile.user_id = auth.users.id
-- We know that verification_requests.user_id should be able to join with users_profile.user_id

-- The real fix is to update the frontend code to use the correct join, but let's also
-- add a proper constraint name that the frontend expects

-- First, let's see if we can rename the existing constraint to match what frontend expects
DO $$
BEGIN
    -- Check if the constraint exists with the expected name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'verification_requests_user_id_fkey'
        AND table_name = 'verification_requests'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- The constraint exists but with a different name, let's find and rename it
        EXECUTE (
            SELECT 'ALTER TABLE verification_requests RENAME CONSTRAINT ' || constraint_name || ' TO verification_requests_user_id_fkey;'
            FROM information_schema.table_constraints 
            WHERE table_name = 'verification_requests'
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%user_id%'
            LIMIT 1
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If renaming fails, we'll add the relationship differently
        RAISE NOTICE 'Could not rename constraint, will add direct relationship';
END $$;

-- Alternative approach: Add a computed column or view that makes the relationship explicit
-- Since both verification_requests.user_id and users_profile.user_id reference auth.users.id,
-- we can create a view that makes this relationship explicit

CREATE OR REPLACE VIEW verification_requests_with_profile AS
SELECT 
    vr.*,
    up.display_name,
    up.handle,
    up.avatar_url,
    up.role_flags
FROM verification_requests vr
INNER JOIN users_profile up ON vr.user_id = up.user_id;

-- Grant access to the view
GRANT SELECT ON verification_requests_with_profile TO authenticated;
GRANT ALL ON verification_requests_with_profile TO service_role;

-- Update the admin dashboard view to use proper joins
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
-- Fix: Join properly using the common user_id field
INNER JOIN users_profile u ON vr.user_id = u.user_id
LEFT JOIN auth.users au ON vr.user_id = au.id
LEFT JOIN users_profile reviewer ON vr.reviewed_by = reviewer.user_id
ORDER BY 
    CASE 
        WHEN vr.status = 'pending' THEN 1
        WHEN vr.status = 'reviewing' THEN 2
        ELSE 3
    END,
    vr.submitted_at DESC;

-- Ensure RLS is properly configured
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Update policies to ensure they work with the corrected relationships
-- (The existing policies should work fine since they use user_id = auth.uid())

-- Add helpful comment explaining the relationship
COMMENT ON COLUMN verification_requests.user_id IS 'References auth.users.id (same as users_profile.user_id)';

-- Log the fix
INSERT INTO domain_events (event_type, event_data, created_at)
VALUES (
    'verification_profile_relationship_fixed',
    jsonb_build_object(
        'migration_version', '049',
        'issue_fixed', 'verification_requests to users_profile relationship',
        'solution', 'Updated admin dashboard view and added helper view',
        'frontend_impact', 'Should resolve PostgREST relationship errors'
    ),
    NOW()
);