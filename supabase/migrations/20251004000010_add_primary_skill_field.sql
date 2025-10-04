-- Add primary_skill field to users_profile
-- This field stores the user's primary profession/specialty for directory listings
-- Examples: "Photographer", "Model", "Videographer", "Makeup Artist", etc.

-- Add the column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS primary_skill TEXT;

-- Add index for directory queries
CREATE INDEX IF NOT EXISTS idx_users_profile_primary_skill ON users_profile(primary_skill) WHERE primary_skill IS NOT NULL;

-- Add comment
COMMENT ON COLUMN users_profile.primary_skill IS 'User''s primary profession/specialty (e.g., "Photographer", "Model", "Videographer"). Used for directory pages and profile display. Should match either a specialization (for contributors) or talent_category (for talent).';

-- Create a view for directory listings that includes primary_skill
CREATE OR REPLACE VIEW directory_profiles AS
SELECT
  id,
  user_id,
  display_name,
  handle,
  avatar_url,
  bio,
  city,
  country,
  primary_skill,
  role_flags,
  specializations,
  talent_categories,
  style_tags,
  vibe_tags,
  years_experience,
  experience_level,
  hourly_rate_min,
  hourly_rate_max,
  available_for_travel,
  profile_completion_percentage,
  account_status,
  created_at
FROM users_profile
WHERE
  account_status IN ('active', 'pending_verification')
  AND avatar_url IS NOT NULL
  AND primary_skill IS NOT NULL
  AND NOT (role_flags @> ARRAY['ADMIN']::user_role[])
ORDER BY created_at DESC;

-- Add RLS policy for directory view
ALTER VIEW directory_profiles OWNER TO postgres;
GRANT SELECT ON directory_profiles TO authenticated, anon;

-- Add comment on view
COMMENT ON VIEW directory_profiles IS 'Public directory view of user profiles filtered by primary_skill, excluding admins and incomplete profiles. Used for directory pages like /directory/photographers, /directory/models, etc.';
