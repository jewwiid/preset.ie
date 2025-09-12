-- Enhanced Verification Fields Migration
-- Add type-specific fields for different verification types

-- First, let's add new columns to verification_requests table
ALTER TABLE verification_requests 
ADD COLUMN IF NOT EXISTS verification_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS professional_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS business_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}';

-- Add new columns to users_profile for verified information sync
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS verified_social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verified_professional_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verified_business_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_badges JSONB DEFAULT '{}';

-- Create index for better performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_verification_requests_verification_data ON verification_requests USING GIN (verification_data);
CREATE INDEX IF NOT EXISTS idx_verification_requests_social_links ON verification_requests USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_users_profile_verified_social_links ON users_profile USING GIN (verified_social_links);

-- Update existing verification requests to have proper structure
UPDATE verification_requests 
SET verification_data = '{}'::jsonb,
    social_links = '{}'::jsonb,
    professional_info = '{}'::jsonb,
    business_info = '{}'::jsonb,
    contact_info = '{}'::jsonb
WHERE verification_data IS NULL 
   OR social_links IS NULL 
   OR professional_info IS NULL 
   OR business_info IS NULL 
   OR contact_info IS NULL;

-- Create function to sync verified data to user profile
CREATE OR REPLACE FUNCTION sync_verified_data_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if verification was approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE users_profile 
        SET 
            verified_social_links = COALESCE(verified_social_links, '{}'::jsonb) || NEW.social_links,
            verified_professional_info = CASE 
                WHEN NEW.request_type = 'professional' THEN NEW.professional_info
                ELSE verified_professional_info
            END,
            verified_business_info = CASE 
                WHEN NEW.request_type = 'business' THEN NEW.business_info
                ELSE verified_business_info
            END,
            verification_badges = COALESCE(verification_badges, '{}'::jsonb) || 
                jsonb_build_object(NEW.request_type, jsonb_build_object(
                    'verified_at', NEW.reviewed_at,
                    'verified_by', NEW.reviewed_by
                )),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically sync verified data
DROP TRIGGER IF EXISTS sync_verified_data_trigger ON verification_requests;
CREATE TRIGGER sync_verified_data_trigger
    AFTER UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_verified_data_to_profile();

-- Add comments for documentation
COMMENT ON COLUMN verification_requests.verification_data IS 'Type-specific verification data (experience, specializations, etc.)';
COMMENT ON COLUMN verification_requests.social_links IS 'Social media links for identity verification';
COMMENT ON COLUMN verification_requests.professional_info IS 'Professional credentials and information';
COMMENT ON COLUMN verification_requests.business_info IS 'Business registration and details';
COMMENT ON COLUMN verification_requests.contact_info IS 'Additional contact information for verification';

COMMENT ON COLUMN users_profile.verified_social_links IS 'Verified social media links synced from approved verifications';
COMMENT ON COLUMN users_profile.verified_professional_info IS 'Verified professional information';
COMMENT ON COLUMN users_profile.verified_business_info IS 'Verified business information';
COMMENT ON COLUMN users_profile.verification_badges IS 'Verification badges and timestamps';

-- Sample data structure documentation
/*
VERIFICATION DATA STRUCTURES:

verification_data: {
  "years_experience": 5,
  "specializations": ["Portrait", "Fashion", "Wedding"],
  "license_number": "PHO123456",
  "alternative_contact": "backup@email.com"
}

social_links: {
  "instagram": "https://instagram.com/username",
  "linkedin": "https://linkedin.com/in/username", 
  "tiktok": "https://tiktok.com/@username",
  "behance": "https://behance.net/username",
  "portfolio": "https://myportfolio.com"
}

professional_info: {
  "portfolio_website": "https://mywork.com",
  "years_experience": 5,
  "license_number": "PHO123456",
  "specializations": ["Portrait", "Fashion"],
  "references": ["contact1@email.com", "contact2@email.com"]
}

business_info: {
  "business_name": "My Photography LLC",
  "website": "https://mybusiness.com",
  "registration_number": "LLC123456",
  "business_address": "123 Business St, City, State",
  "business_type": "Photography Services",
  "tax_id": "TAX123456"
}

contact_info: {
  "phone": "+1234567890",
  "alternative_email": "backup@email.com",
  "emergency_contact": "emergency@email.com"
}
*/