-- Add collaboration invitation privacy setting
-- Allows users to control whether they can receive collaboration invitations

-- Add the column
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS allow_collaboration_invites BOOLEAN DEFAULT true;

-- Create index for filtering in user search
CREATE INDEX IF NOT EXISTS idx_users_profile_allow_collaboration_invites ON users_profile(allow_collaboration_invites);

-- Add comment
COMMENT ON COLUMN users_profile.allow_collaboration_invites IS 'Privacy: Allow users to send collaboration/project invitations. When false, user will not appear in invitation search results and cannot receive new invitations.';

-- Update directory_profiles view to include this setting
DROP VIEW IF EXISTS directory_profiles;

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
  allow_collaboration_invites,
  created_at
FROM users_profile
WHERE
  account_status IN ('active', 'pending_verification')
  AND avatar_url IS NOT NULL
  AND primary_skill IS NOT NULL
  AND NOT (role_flags @> ARRAY['ADMIN']::user_role[])
  AND allow_collaboration_invites = true  -- Only show users who accept invitations
ORDER BY created_at DESC;

-- Add comment on updated view
COMMENT ON VIEW directory_profiles IS 'Public directory view of user profiles filtered by primary_skill, excluding admins, incomplete profiles, and users who disabled collaboration invites. Used for directory pages like /photographers, /models, etc.';
