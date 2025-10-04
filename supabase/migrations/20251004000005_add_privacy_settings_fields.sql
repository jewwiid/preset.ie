-- Add privacy settings fields to users_profile table
-- These fields support the Privacy Settings section with toggle options
-- Note: show_age, show_location, show_physical_attributes already exist from previous migrations

-- Add privacy preference columns
ALTER TABLE users_profile
-- Contact information visibility (3 fields)
ADD COLUMN IF NOT EXISTS show_phone BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_website BOOLEAN DEFAULT true,

-- Professional information visibility (4 fields)
ADD COLUMN IF NOT EXISTS show_experience BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_specializations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_equipment BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_rates BOOLEAN DEFAULT false,

-- Search & discovery settings (3 fields)
ADD COLUMN IF NOT EXISTS include_in_search BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_availability BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_direct_messages BOOLEAN DEFAULT true,

-- Data & analytics settings (2 fields)
ADD COLUMN IF NOT EXISTS share_analytics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS participate_research BOOLEAN DEFAULT false;

-- Create indexes for commonly queried privacy fields
CREATE INDEX IF NOT EXISTS idx_users_profile_include_in_search ON users_profile(include_in_search);
CREATE INDEX IF NOT EXISTS idx_users_profile_allow_direct_messages ON users_profile(allow_direct_messages);
CREATE INDEX IF NOT EXISTS idx_users_profile_show_rates ON users_profile(show_rates);

-- Add comments for documentation
COMMENT ON COLUMN users_profile.show_phone IS 'Privacy: Show phone number on profile';
COMMENT ON COLUMN users_profile.show_social_links IS 'Privacy: Show social media links (Instagram, TikTok, etc.)';
COMMENT ON COLUMN users_profile.show_website IS 'Privacy: Show website and portfolio links';
COMMENT ON COLUMN users_profile.show_experience IS 'Privacy: Show experience level and years of experience';
COMMENT ON COLUMN users_profile.show_specializations IS 'Privacy: Show specializations and skills';
COMMENT ON COLUMN users_profile.show_equipment IS 'Privacy: Show equipment list and software';
COMMENT ON COLUMN users_profile.show_rates IS 'Privacy: Show hourly rate and pricing information';
COMMENT ON COLUMN users_profile.include_in_search IS 'Privacy: Include profile in search results and discovery';
COMMENT ON COLUMN users_profile.show_availability IS 'Privacy: Show availability status to other users';
COMMENT ON COLUMN users_profile.allow_direct_messages IS 'Privacy: Allow other users to send direct messages';
COMMENT ON COLUMN users_profile.share_analytics IS 'Privacy: Share profile view analytics with platform';
COMMENT ON COLUMN users_profile.participate_research IS 'Privacy: Participate in platform research and surveys';
