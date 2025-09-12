-- User-safe verification bucket setup (Fixed)
-- Run this in Supabase Dashboard SQL Editor

-- 1. Create the bucket (this should work)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents', 
    false, -- PRIVATE bucket for security
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create GDPR cleanup function (fixed variable declaration)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_documents()
RETURNS void AS $$
DECLARE
    cleanup_count INTEGER;
BEGIN
    -- Update verification requests to mark expired documents
    UPDATE verification_requests 
    SET document_url = NULL,
        admin_notes = COALESCE(admin_notes, '') || ' [Document auto-deleted after 30 days for GDPR compliance]'
    WHERE document_url IS NOT NULL
    AND submitted_at < NOW() - INTERVAL '30 days'
    AND admin_notes NOT LIKE '%auto-deleted%';
    
    -- Log how many were cleaned up
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % verification documents older than 30 days', cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- 3. Test the cleanup function
SELECT cleanup_expired_verification_documents();

-- 4. Check if bucket was created successfully
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE id = 'verification-documents';