-- Simple test account creation script (profiles only)
-- This creates test user profiles without requiring the public.users table

-- Create admin profile
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
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    'Admin User',
    'admin',
    'System administrator for Preset platform',
    ARRAY['ADMIN']::user_role[],
    'PRO',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
);

-- Create talent profile
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
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440001',
    'Talent User',
    'talent',
    'Professional photographer and content creator',
    ARRAY['TALENT']::user_role[],
    'FREE',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440001'
);

-- Create client profile
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
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440002',
    'Client User',
    'client',
    'Looking for talented photographers for my projects',
    ARRAY['CLIENT']::user_role[],
    'FREE',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440002'
);

-- Create equipment provider profile
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
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440003',
    'Equipment Provider',
    'equipment',
    'Professional camera and lighting equipment rental',
    ARRAY['EQUIPMENT_PROVIDER']::user_role[],
    'PRO',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440003'
);

-- Create multi-role profile
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
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440004',
    'Multi Role User',
    'multirole',
    'Photographer who also hires other talent for larger projects',
    ARRAY['TALENT', 'CLIENT']::user_role[],
    'PRO',
    'ACTIVE',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM public.users_profile 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440004'
);

-- Create user credits for all users (if table exists)
INSERT INTO public.user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at,
    lifetime_consumed,
    created_at,
    updated_at
) 
SELECT user_id, subscription_tier, monthly_allowance, current_balance, consumed_this_month, last_reset_at, lifetime_consumed, created_at, updated_at
FROM (VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'PRO', 1000, 1000, 0, NOW(), 0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', 'FREE', 10, 10, 0, NOW(), 0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'FREE', 10, 10, 0, NOW(), 0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'PRO', 1000, 1000, 0, NOW(), 0, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', 'PRO', 1000, 1000, 0, NOW(), 0, NOW(), NOW())
) AS v(user_id, subscription_tier, monthly_allowance, current_balance, consumed_this_month, last_reset_at, lifetime_consumed, created_at, updated_at)
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_credits 
    WHERE user_credits.user_id = v.user_id
);

-- Create user settings for all users (if table exists)
INSERT INTO public.user_settings (
    user_id,
    email_notifications,
    push_notifications,
    marketing_emails,
    profile_visibility,
    show_contact_info,
    two_factor_enabled,
    created_at,
    updated_at
) 
SELECT user_id, email_notifications, push_notifications, marketing_emails, profile_visibility, show_contact_info, two_factor_enabled, created_at, updated_at
FROM (VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', TRUE, TRUE, FALSE, 'public', TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', TRUE, TRUE, FALSE, 'public', TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', TRUE, TRUE, FALSE, 'public', TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', TRUE, TRUE, FALSE, 'public', TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', TRUE, TRUE, FALSE, 'public', TRUE, FALSE, NOW(), NOW())
) AS v(user_id, email_notifications, push_notifications, marketing_emails, profile_visibility, show_contact_info, two_factor_enabled, created_at, updated_at)
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_settings.user_id = v.user_id
);

-- Show created users
SELECT 
    user_id,
    display_name,
    handle,
    role_flags,
    subscription_tier,
    created_at
FROM public.users_profile
ORDER BY created_at;

-- Success message
SELECT 'Test profiles created successfully!' as status,
       'Admin: admin@preset.ie (ID: 550e8400-e29b-41d4-a716-446655440000)' as admin_info,
       'Talent: talent@preset.ie (ID: 550e8400-e29b-41d4-a716-446655440001)' as talent_info,
       'Client: client@preset.ie (ID: 550e8400-e29b-41d4-a716-446655440002)' as client_info,
       'Equipment: equipment@preset.ie (ID: 550e8400-e29b-41d4-a716-446655440003)' as equipment_info,
       'Multi-role: multirole@preset.ie (ID: 550e8400-e29b-41d4-a716-446655440004)' as multirole_info;
