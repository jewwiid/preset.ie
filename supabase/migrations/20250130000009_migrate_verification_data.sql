-- Migration: Migrate existing verification_requests data to new verification_submissions table
-- This script handles the transition from the old multi-row system to the new single-row system

-- 1. Migrate existing verification_requests to verification_submissions
-- For each user, take their most recent verification request
INSERT INTO public.verification_submissions (
  user_id,
  status,
  verification_type,
  submitted_at,
  reviewed_by,
  reviewed_at,
  rejection_reason,
  review_notes,
  notes,
  metadata,
  updated_at
)
SELECT DISTINCT ON (user_id)
  user_id,
  status,
  verification_type,
  submitted_at,
  reviewed_by,
  reviewed_at,
  rejection_reason,
  review_notes,
  rejection_reason, -- Use rejection_reason as notes
  COALESCE(metadata, '{}'::jsonb), -- Preserve existing metadata
  updated_at
FROM public.verification_requests
WHERE user_id IS NOT NULL
ORDER BY user_id, submitted_at DESC;

-- 2. Update verification status in users_profile based on new submissions
-- This ensures the profile reflects the current verification status
UPDATE public.users_profile 
SET 
  verified_id = CASE 
    WHEN vs.status = 'approved' AND vs.verification_type = 'identity' THEN true
    ELSE verified_id
  END,
  age_verified = CASE 
    WHEN vs.status = 'approved' AND vs.verification_type = 'identity' THEN true
    ELSE age_verified
  END,
  verified_professional = CASE 
    WHEN vs.status = 'approved' AND vs.verification_type = 'professional' THEN true
    ELSE verified_professional
  END,
  verified_business = CASE 
    WHEN vs.status = 'approved' AND vs.verification_type = 'business' THEN true
    ELSE verified_business
  END
FROM public.verification_submissions vs
WHERE users_profile.user_id = vs.user_id
AND vs.status = 'approved';

-- 3. Create verification badges for approved submissions
INSERT INTO public.verification_badges (user_id, badge_type, issued_at, issued_by)
SELECT 
  vs.user_id,
  CASE vs.verification_type
    WHEN 'identity' THEN 'verified_identity'
    WHEN 'professional' THEN 'verified_professional' 
    WHEN 'business' THEN 'verified_business'
  END,
  vs.reviewed_at,
  vs.reviewed_by
FROM public.verification_submissions vs
WHERE vs.status = 'approved'
AND vs.reviewed_at IS NOT NULL
ON CONFLICT (user_id, badge_type) DO NOTHING;

-- 4. Add a comment explaining the migration
COMMENT ON TABLE public.verification_requests IS 'DEPRECATED: This table has been replaced by verification_submissions. Data has been migrated.';

-- 5. Optional: Drop the old table after confirming migration success
-- Uncomment the following lines after verifying the migration worked correctly:
-- 
-- DROP TABLE IF EXISTS public.verification_requests CASCADE;
--
-- Note: Only drop after confirming:
-- 1. All data migrated correctly
-- 2. New system works as expected
-- 3. No dependencies on the old table
