-- Create admin account manually
-- Run this in your Supabase SQL editor

-- First, check if the user already exists
SELECT id, email FROM auth.users WHERE email = 'admin@preset.ie';

-- If the user doesn't exist, you'll need to create it through the signup process
-- or use the Supabase dashboard to create a user manually

-- Once the user exists, create/update the profile
INSERT INTO users_profile (
  user_id,
  display_name,
  handle,
  bio,
  city,
  role_flags,
  style_tags,
  subscription_tier,
  subscription_status,
  account_status
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@preset.ie'),
  'Admin User',
  'admin',
  'Platform Administrator',
  'Dublin',
  ARRAY['ADMIN', 'CONTRIBUTOR', 'TALENT'],
  ARRAY[]::text[],
  'PRO',
  'ACTIVE',
  'active'
) ON CONFLICT (user_id) DO UPDATE SET
  role_flags = ARRAY['ADMIN', 'CONTRIBUTOR', 'TALENT'],
  display_name = 'Admin User',
  bio = 'Platform Administrator',
  subscription_tier = 'PRO',
  updated_at = NOW();

-- Verify the admin profile was created
SELECT 
  up.display_name,
  up.handle,
  up.role_flags,
  up.subscription_tier,
  au.email
FROM users_profile up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email = 'admin@preset.ie';
