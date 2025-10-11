-- Migration: Fix verification badges deduplication
-- Add unique constraint to prevent duplicate badges per user

-- 1. Add unique index for verification badges
CREATE UNIQUE INDEX IF NOT EXISTS ux_verification_badges_user_type 
ON public.verification_badges(user_id, badge_type);

-- 2. Re-run badge issuance for approved submissions (with deduplication)
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

-- 3. Add comment for documentation
COMMENT ON INDEX ux_verification_badges_user_type IS 'Ensures users can only have one badge per verification type';
