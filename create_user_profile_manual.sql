-- Manual profile creation for current OAuth user
-- This doesn't require owner permissions on auth.users

-- First, let's verify your user exists
SELECT 'Current OAuth user:' as status;
SELECT 
  id,
  email,
  created_at,
  raw_app_meta_data->>'provider' as provider,
  raw_user_meta_data->>'name' as google_name
FROM auth.users 
WHERE id = '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd';

-- Create your profile manually
SELECT 'Creating profile for OAuth user:' as status;

INSERT INTO public.users_profile (
    user_id,
    display_name,
    handle,
    bio,
    role_flags,
    subscription_tier,
    subscription_status,
    created_at,
    updated_at
) VALUES (
    '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd',
    'YJ Nation',  -- You can customize this
    'yjnation_' || extract(epoch from now())::bigint,  -- Unique handle
    'Welcome to Preset! Excited to get started.',
    ARRAY['TALENT']::user_role[],
    'FREE'::subscription_tier,
    'ACTIVE'::subscription_status,
    NOW(),
    NOW()
);

-- Verify your profile was created
SELECT 'Profile verification:' as status;
SELECT 
    user_id,
    display_name,
    handle,
    bio,
    role_flags,
    subscription_tier,
    created_at
FROM users_profile 
WHERE user_id = '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd';

-- Check the complete user setup
SELECT 'Complete user setup check:' as status;
SELECT 
    au.email,
    au.created_at as user_created,
    up.display_name,
    up.handle,
    up.role_flags,
    up.created_at as profile_created
FROM auth.users au
JOIN users_profile up ON au.id = up.user_id
WHERE au.id = '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd';

SELECT '✅ YOUR PROFILE HAS BEEN CREATED!' as result;
SELECT 'You can now refresh your app and access the dashboard' as next_step;
