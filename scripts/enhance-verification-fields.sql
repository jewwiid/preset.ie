-- Enhance Verification Fields - Safe Standalone Script
-- Run this in Supabase Dashboard SQL Editor

-- Add new columns to verification_requests table (safe with IF NOT EXISTS)
DO $$
BEGIN
    -- Add verification_data column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_requests' 
        AND column_name = 'verification_data'
    ) THEN
        ALTER TABLE verification_requests ADD COLUMN verification_data JSONB DEFAULT '{}';
    END IF;

    -- Add social_links column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_requests' 
        AND column_name = 'social_links'
    ) THEN
        ALTER TABLE verification_requests ADD COLUMN social_links JSONB DEFAULT '{}';
    END IF;

    -- Add professional_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_requests' 
        AND column_name = 'professional_info'
    ) THEN
        ALTER TABLE verification_requests ADD COLUMN professional_info JSONB DEFAULT '{}';
    END IF;

    -- Add business_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_requests' 
        AND column_name = 'business_info'
    ) THEN
        ALTER TABLE verification_requests ADD COLUMN business_info JSONB DEFAULT '{}';
    END IF;

    -- Add contact_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'verification_requests' 
        AND column_name = 'contact_info'
    ) THEN
        ALTER TABLE verification_requests ADD COLUMN contact_info JSONB DEFAULT '{}';
    END IF;

    RAISE NOTICE '✅ Added verification_requests enhancement columns';
END $$;

-- Add new columns to users_profile for verified information sync
DO $$
BEGIN
    -- Add verified_social_links column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'verified_social_links'
    ) THEN
        ALTER TABLE users_profile ADD COLUMN verified_social_links JSONB DEFAULT '{}';
    END IF;

    -- Add verified_professional_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'verified_professional_info'
    ) THEN
        ALTER TABLE users_profile ADD COLUMN verified_professional_info JSONB DEFAULT '{}';
    END IF;

    -- Add verified_business_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'verified_business_info'
    ) THEN
        ALTER TABLE users_profile ADD COLUMN verified_business_info JSONB DEFAULT '{}';
    END IF;

    -- Add verification_badges column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users_profile' 
        AND column_name = 'verification_badges'
    ) THEN
        ALTER TABLE users_profile ADD COLUMN verification_badges JSONB DEFAULT '{}';
    END IF;

    RAISE NOTICE '✅ Added users_profile enhancement columns';
END $$;

-- Create indexes for better performance on JSONB columns
CREATE INDEX IF NOT EXISTS idx_verification_requests_verification_data ON verification_requests USING GIN (verification_data);
CREATE INDEX IF NOT EXISTS idx_verification_requests_social_links ON verification_requests USING GIN (social_links);
CREATE INDEX IF NOT EXISTS idx_users_profile_verified_social_links ON users_profile USING GIN (verified_social_links);

-- Update existing verification requests to have proper structure
UPDATE verification_requests 
SET verification_data = COALESCE(verification_data, '{}'::jsonb),
    social_links = COALESCE(social_links, '{}'::jsonb),
    professional_info = COALESCE(professional_info, '{}'::jsonb),
    business_info = COALESCE(business_info, '{}'::jsonb),
    contact_info = COALESCE(contact_info, '{}'::jsonb);

-- Update existing user profiles to have proper structure
UPDATE users_profile 
SET verified_social_links = COALESCE(verified_social_links, '{}'::jsonb),
    verified_professional_info = COALESCE(verified_professional_info, '{}'::jsonb),
    verified_business_info = COALESCE(verified_business_info, '{}'::jsonb),
    verification_badges = COALESCE(verification_badges, '{}'::jsonb);

-- Create function to sync verified data to user profile
CREATE OR REPLACE FUNCTION sync_verified_data_to_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if verification was approved
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
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
                    'verified_by', NEW.reviewed_by,
                    'verification_data', NEW.verification_data
                )),
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        RAISE NOTICE 'Synced verification data for user % - type: %', NEW.user_id, NEW.request_type;
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

-- Test the new columns exist
SELECT 
    'verification_requests columns:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'verification_requests' 
AND column_name IN ('verification_data', 'social_links', 'professional_info', 'business_info', 'contact_info')
ORDER BY column_name;

SELECT 
    'users_profile columns:' as info,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users_profile' 
AND column_name IN ('verified_social_links', 'verified_professional_info', 'verified_business_info', 'verification_badges')
ORDER BY column_name;

-- Show success message
SELECT '✅ Enhanced verification system ready!' as status;