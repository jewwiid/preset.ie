-- Create secure verification documents bucket
-- Run this in Supabase Dashboard SQL Editor

-- 1. Create the bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'verification-documents',
    'verification-documents', 
    false, -- PRIVATE bucket for security
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can upload to their own folder
CREATE POLICY "Users can upload verification documents"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
);

-- 4. Policy: Only admins can read verification documents
CREATE POLICY "Admins can view verification documents"
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

-- 5. Policy: Users can read their own verification documents
CREATE POLICY "Users can view own verification documents"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'verification-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND auth.role() = 'authenticated'
);

-- 6. Policy: Allow deletion for cleanup (admins only)
CREATE POLICY "Admins can delete verification documents"
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

-- 7. Create function for auto-cleanup (GDPR compliance)
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
        admin_notes = COALESCE(admin_notes, '') || ' [Document auto-deleted after 30 days]'
    WHERE document_url IS NOT NULL
    AND submitted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Schedule cleanup function to run daily (requires pg_cron extension)
-- Note: This may need to be set up separately depending on Supabase plan
-- SELECT cron.schedule('cleanup-verification-docs', '0 2 * * *', 'SELECT cleanup_expired_verification_documents();');

-- 9. Test the bucket creation
SELECT 
    id, 
    name, 
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'verification-documents';