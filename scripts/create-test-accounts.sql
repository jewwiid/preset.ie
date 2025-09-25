-- =====================================================
-- CREATE TEST ACCOUNTS FOR ALL ROLES
-- =====================================================
-- This script creates test users for all roles to test the OAuth flow
-- Run this after setting up the database triggers

-- =====================================================
-- STEP 1: CREATE ADMIN USER
-- =====================================================

-- Insert admin user into auth.users (this would normally be done by Supabase Auth)
-- Note: In real scenario, this would be created via Supabase Auth signup
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@preset.ie',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Admin User", "avatar_url": null}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

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

-- Create admin user record
INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@preset.ie',
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: CREATE TALENT USER
-- =====================================================

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'talent@preset.ie',
    crypt('talent123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Talent User", "avatar_url": null}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

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

INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'talent@preset.ie',
    'TALENT',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 3: CREATE CLIENT USER
-- =====================================================

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'client@preset.ie',
    crypt('client123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Client User", "avatar_url": null}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

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

INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'client@preset.ie',
    'CLIENT',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 4: CREATE EQUIPMENT PROVIDER USER
-- =====================================================

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'equipment@preset.ie',
    crypt('equipment123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Equipment Provider", "avatar_url": null}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

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

INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'equipment@preset.ie',
    'EQUIPMENT_PROVIDER',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 5: CREATE MULTI-ROLE USER (TALENT + CLIENT)
-- =====================================================

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'multirole@preset.ie',
    crypt('multirole123', gen_salt('bf')),
    NOW(),
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Multi Role User", "avatar_url": null}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

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

INSERT INTO public.users (
    id,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    'multirole@preset.ie',
    'TALENT', -- Primary role
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 6: CREATE SUPPORTING RECORDS FOR ALL USERS
-- =====================================================

-- Create user credits for all users
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

-- Create notification preferences for all users
INSERT INTO public.notification_preferences (
    user_id,
    email_enabled,
    push_enabled,
    in_app_enabled,
    gig_notifications,
    application_notifications,
    message_notifications,
    booking_notifications,
    system_notifications,
    marketing_notifications,
    created_at,
    updated_at
) 
SELECT user_id, email_enabled, push_enabled, in_app_enabled, gig_notifications, application_notifications, message_notifications, booking_notifications, system_notifications, marketing_notifications, created_at, updated_at
FROM (VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440001', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440004', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, NOW(), NOW())
) AS v(user_id, email_enabled, push_enabled, in_app_enabled, gig_notifications, application_notifications, message_notifications, booking_notifications, system_notifications, marketing_notifications, created_at, updated_at)
WHERE NOT EXISTS (
    SELECT 1 FROM public.notification_preferences 
    WHERE notification_preferences.user_id = v.user_id
);

-- Create user settings for all users
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

-- =====================================================
-- STEP 7: VERIFICATION
-- =====================================================

-- Show created users
SELECT 
    up.user_id,
    up.display_name,
    up.handle,
    up.role_flags,
    up.subscription_tier,
    u.email,
    u.role as primary_role
FROM public.users_profile up
JOIN public.users u ON up.user_id = u.id
ORDER BY up.created_at;

-- Show user counts by role
SELECT 
    role,
    COUNT(*) as user_count
FROM public.users
GROUP BY role
ORDER BY role;

-- Show subscription distribution
SELECT 
    subscription_tier,
    COUNT(*) as user_count
FROM public.users_profile
GROUP BY subscription_tier
ORDER BY subscription_tier;

-- Success message
SELECT 'Test accounts created successfully!' as status,
       'Admin: admin@preset.ie / admin123' as admin_credentials,
       'Talent: talent@preset.ie / talent123' as talent_credentials,
       'Client: client@preset.ie / client123' as client_credentials,
       'Equipment: equipment@preset.ie / equipment123' as equipment_credentials,
       'Multi-role: multirole@preset.ie / multirole123' as multirole_credentials;
