-- Enable the OAuth profile creation trigger

-- First check current status
SELECT 'Current trigger status:' as status;
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'DISABLED' 
    WHEN 'D' THEN 'DISABLED' 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'UNKNOWN' 
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname = 'create_oauth_profile_trigger';

-- Enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER create_oauth_profile_trigger;

-- Verify it's now enabled
SELECT 'Trigger after enabling:' as status;
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled 
    WHEN 'O' THEN 'DISABLED' 
    WHEN 'D' THEN 'DISABLED' 
    WHEN 'R' THEN 'ENABLED' 
    WHEN 'A' THEN 'ENABLED' 
    ELSE 'UNKNOWN' 
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'auth' 
  AND c.relname = 'users'
  AND t.tgname = 'create_oauth_profile_trigger';

-- Test by manually creating a profile for your existing user
SELECT 'Creating profile for existing OAuth user:' as status;

-- Create profile for the user who just signed up
INSERT INTO public.users_profile (
    user_id,
    display_name,
    handle,
    bio,
    role_flags,
    subscription_tier,
    subscription_status
) VALUES (
    '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd',
    'YJ Nation',  -- You can change this
    'user_57fe9bb7b5a04f71bff5241eecdd4dfd',  -- Unique handle based on user ID
    'Welcome to Preset!',
    ARRAY['TALENT']::user_role[],
    'FREE'::subscription_tier,
    'ACTIVE'::subscription_status
);

-- Verify the profile was created
SELECT 'Profile creation verification:' as status;
SELECT 
  user_id,
  display_name,
  handle,
  role_flags,
  created_at
FROM users_profile 
WHERE user_id = '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd';

SELECT '✅ TRIGGER ENABLED AND PROFILE CREATED!' as result;
SELECT 'Future OAuth users will get profiles automatically' as note;
