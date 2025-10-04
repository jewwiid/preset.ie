-- Add work preference fields to users_profile table
-- These fields support the Work Preferences section with toggle options

-- Add work preference columns
ALTER TABLE users_profile
-- Compensation preferences
ADD COLUMN IF NOT EXISTS accepts_tfp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_expenses_only BOOLEAN DEFAULT false,

-- Location preferences
ADD COLUMN IF NOT EXISTS prefers_studio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prefers_outdoor BOOLEAN DEFAULT false,

-- Schedule preferences
ADD COLUMN IF NOT EXISTS available_weekdays BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS available_weekends BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_evenings BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS available_overnight BOOLEAN DEFAULT false,

-- Collaboration preferences
ADD COLUMN IF NOT EXISTS works_with_teams BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS prefers_solo_work BOOLEAN DEFAULT false,

-- Content comfort preferences
ADD COLUMN IF NOT EXISTS comfortable_with_nudity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS comfortable_with_intimate_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_model_release BOOLEAN DEFAULT true;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_users_profile_accepts_tfp ON users_profile(accepts_tfp);
CREATE INDEX IF NOT EXISTS idx_users_profile_available_weekdays ON users_profile(available_weekdays);
CREATE INDEX IF NOT EXISTS idx_users_profile_available_weekends ON users_profile(available_weekends);
CREATE INDEX IF NOT EXISTS idx_users_profile_works_with_teams ON users_profile(works_with_teams);
CREATE INDEX IF NOT EXISTS idx_users_profile_prefers_studio ON users_profile(prefers_studio);
CREATE INDEX IF NOT EXISTS idx_users_profile_prefers_outdoor ON users_profile(prefers_outdoor);

-- Add comments for documentation
COMMENT ON COLUMN users_profile.accepts_tfp IS 'User accepts TFP (Trade for Portfolio) work';
COMMENT ON COLUMN users_profile.accepts_expenses_only IS 'User accepts work with expenses only (no fee)';
COMMENT ON COLUMN users_profile.prefers_studio IS 'User prefers working in studio environments';
COMMENT ON COLUMN users_profile.prefers_outdoor IS 'User prefers outdoor/location shoots';
COMMENT ON COLUMN users_profile.available_weekdays IS 'User is available for work on weekdays';
COMMENT ON COLUMN users_profile.available_weekends IS 'User is available for work on weekends';
COMMENT ON COLUMN users_profile.available_evenings IS 'User is available for evening work';
COMMENT ON COLUMN users_profile.available_overnight IS 'User is available for overnight shoots';
COMMENT ON COLUMN users_profile.works_with_teams IS 'User is comfortable working with teams';
COMMENT ON COLUMN users_profile.prefers_solo_work IS 'User prefers working solo/one-on-one';
COMMENT ON COLUMN users_profile.comfortable_with_nudity IS 'User is comfortable with nude/artistic nudity content';
COMMENT ON COLUMN users_profile.comfortable_with_intimate_content IS 'User is comfortable with intimate/romantic content';
COMMENT ON COLUMN users_profile.requires_model_release IS 'User requires model release forms for all work';
