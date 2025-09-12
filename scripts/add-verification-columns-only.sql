-- Add Verification Columns Only
-- Run this in Supabase Dashboard > SQL Editor
-- This script only adds the missing columns without recreating views

-- 1. Add enhanced verification fields to verification_requests table
ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS professional_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS request_type TEXT CHECK (request_type IN ('age', 'identity', 'professional', 'business')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Add verification fields to users_profile table
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS verified_social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verified_professional_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verified_business_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_badges JSONB DEFAULT '{}';

-- 3. Update verification_requests to include 'age' type
ALTER TABLE verification_requests 
DROP CONSTRAINT IF EXISTS verification_requests_verification_type_check;

ALTER TABLE verification_requests 
ADD CONSTRAINT verification_requests_verification_type_check 
CHECK (verification_type IN ('age', 'identity', 'professional', 'business'));

-- 4. Update verification_badges to include age verification
ALTER TABLE verification_badges 
DROP CONSTRAINT IF EXISTS verification_badges_badge_type_check;

ALTER TABLE verification_badges 
ADD CONSTRAINT verification_badges_badge_type_check 
CHECK (badge_type IN ('verified_age', 'verified_identity', 'verified_professional', 'verified_business'));

-- 5. Create indexes for performance
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

-- 6. Add comments for documentation
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

-- Success message
SELECT 'Verification Columns Added Successfully!' as status;
