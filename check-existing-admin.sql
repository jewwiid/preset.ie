-- Check if the admin user already exists and what records are present
SELECT 
    'Checking existing admin user...' as status;

-- Check auth.users
SELECT 
    'auth.users' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'admin@preset.ie';

-- Check public.users
SELECT 
    'public.users' as table_name,
    id,
    email,
    role,
    subscription_tier,
    created_at
FROM public.users 
WHERE email = 'admin@preset.ie';

-- Check users_profile
SELECT 
    'users_profile' as table_name,
    user_id,
    display_name,
    handle,
    first_name,
    last_name,
    city,
    country
FROM public.users_profile 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Check user_settings
SELECT 
    'user_settings' as table_name,
    user_id,
    email_notifications,
    push_notifications,
    profile_visibility
FROM public.user_settings 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Check user_credits
SELECT 
    'user_credits' as table_name,
    user_id,
    subscription_tier,
    current_balance,
    monthly_allowance
FROM public.user_credits 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;

-- Check notification_preferences
SELECT 
    'notification_preferences' as table_name,
    user_id,
    email_enabled,
    push_enabled,
    gig_notifications
FROM public.notification_preferences 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'::uuid;
