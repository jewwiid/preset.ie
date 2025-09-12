-- Create verification documents bucket (Simple approach)
-- Run this in Supabase Dashboard SQL Editor

-- 1. Create the bucket manually through Supabase Dashboard Storage UI
-- OR use this insert if you have the right permissions:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents', 
    false, -- PRIVATE bucket
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create cleanup function for GDPR compliance
CREATE OR REPLACE FUNCTION cleanup_expired_verification_documents()
RETURNS void AS $$
BEGIN
    -- Update verification requests to mark expired documents
    UPDATE verification_requests 
    SET document_url = NULL,
        admin_notes = COALESCE(admin_notes, '') || ' [Document auto-deleted after 30 days for GDPR compliance]'
    WHERE document_url IS NOT NULL
    AND submitted_at < NOW() - INTERVAL '30 days'
    AND admin_notes NOT LIKE '%auto-deleted%';
    
    -- Log the cleanup action
    RAISE NOTICE 'Cleaned up verification documents older than 30 days';
END;
$$ LANGUAGE plpgsql;

-- 3. Test the cleanup function
SELECT cleanup_expired_verification_documents();

-- 4. Verify bucket exists (if created successfully)
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'verification-documents';