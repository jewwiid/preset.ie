-- Migration: Implement new verification workflow with verification_submissions table
-- This replaces the multiple verification_requests approach with a cleaner single-table design

-- 1. Create the new verification_submissions table
CREATE TABLE IF NOT EXISTS public.verification_submissions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid NULL REFERENCES auth.users(id),
  reviewed_at timestamptz NULL,
  notes text NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Additional fields for tracking submission details
  verification_type text NOT NULL DEFAULT 'identity' CHECK (verification_type IN ('identity', 'professional', 'business')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  rejection_reason text NULL,
  review_notes text NULL,
  
  -- Store additional metadata as JSONB
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Create trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_verification_submissions_updated_at
  BEFORE UPDATE ON public.verification_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 3. Enable RLS
ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for verification_submissions
-- Users can view their own submissions
CREATE POLICY "Users can view their own verification submissions"
ON public.verification_submissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own submissions (when no existing submission or status is rejected)
CREATE POLICY "Users can create verification submissions"
ON public.verification_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  (
    NOT EXISTS (
      SELECT 1 FROM public.verification_submissions vs2 
      WHERE vs2.user_id = auth.uid() 
      AND vs2.status IN ('pending', 'approved')
    ) OR
    EXISTS (
      SELECT 1 FROM public.verification_submissions vs3 
      WHERE vs3.user_id = auth.uid() 
      AND vs3.status = 'rejected'
    )
  )
);

-- Users can update their own submissions only when rejected (for resubmission)
CREATE POLICY "Users can update rejected verification submissions"
ON public.verification_submissions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND status = 'rejected')
WITH CHECK (user_id = auth.uid());

-- Admins can view all submissions
CREATE POLICY "Admins can view all verification submissions"
ON public.verification_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = auth.uid() 
    AND role_flags && ARRAY['ADMIN']::user_role[]
  )
);

-- Admins can update submissions (for review)
CREATE POLICY "Admins can update verification submissions"
ON public.verification_submissions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = auth.uid() 
    AND role_flags && ARRAY['ADMIN']::user_role[]
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = auth.uid() 
    AND role_flags && ARRAY['ADMIN']::user_role[]
  )
);

-- 5. Create storage policies for verification-documents bucket
-- Note: These assume the bucket exists and has proper folder structure

-- Policy 1: Users can upload only when status = 'rejected'
CREATE POLICY "Users can upload verification documents (rejected only)"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents' AND
  storage.foldername(name)[1] = auth.uid()::text AND
  storage.extension(name) IN ('jpg', 'jpeg', 'png', 'pdf') AND
  EXISTS (
    SELECT 1 FROM public.verification_submissions vs 
    WHERE vs.user_id = auth.uid() 
    AND vs.status = 'rejected'
  )
);

-- Policy 2: Users can view their own files
CREATE POLICY "Users can view own verification docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  storage.foldername(name)[1] = auth.uid()::text
);

-- Policy 3: Users can delete only when status = 'rejected'
CREATE POLICY "Users can delete verification docs (rejected only)"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  storage.foldername(name)[1] = auth.uid()::text AND
  EXISTS (
    SELECT 1 FROM public.verification_submissions vs 
    WHERE vs.user_id = auth.uid() 
    AND vs.status = 'rejected'
  )
);

-- Policy 4: Admins can view all verification documents
CREATE POLICY "Admins can view all verification documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = auth.uid() 
    AND role_flags && ARRAY['ADMIN']::user_role[]
  )
);

-- Policy 5: Admins can delete verification documents (for GDPR compliance)
CREATE POLICY "Admins can delete verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents' AND
  EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = auth.uid() 
    AND role_flags && ARRAY['ADMIN']::user_role[]
  )
);

-- 6. Add helpful indexes
CREATE INDEX IF NOT EXISTS idx_verification_submissions_status ON public.verification_submissions(status);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_verification_type ON public.verification_submissions(verification_type);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_submitted_at ON public.verification_submissions(submitted_at);

-- 7. Add comments for documentation
COMMENT ON TABLE public.verification_submissions IS 'Tracks user verification status and gates document uploads/deletes';
COMMENT ON COLUMN public.verification_submissions.status IS 'Current verification status - gates user actions on storage';
COMMENT ON COLUMN public.verification_submissions.metadata IS 'Additional verification data (social links, professional info, etc.)';
