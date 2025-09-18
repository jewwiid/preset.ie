-- Final solution: Create admin user manually without relying on triggers
-- This bypasses all trigger issues and creates the admin user directly

-- First, let's create the admin user in auth.users manually
-- We'll use a specific UUID to ensure consistency
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
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    'admin@preset.ie',
    crypt('Admin123!@#', gen_salt('bf')),
    NOW(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "ADMIN"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Create the corresponding entry in public.users
INSERT INTO public.users (
    id,
    email,
    role,
    subscription_tier,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'admin@preset.ie',
    'ADMIN',
    'PRO',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create the user profile
INSERT INTO public.users_profile (
    user_id,
    display_name,
    handle,
    first_name,
    last_name,
    bio,
    location,
    website,
    instagram_handle,
    tiktok_handle,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'Admin User',
    'admin',
    'Admin',
    'User',
    'System administrator for Preset platform',
    'Dublin, Ireland',
    'https://preset.ie',
    'preset.ie',
    'preset.ie',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create user settings
INSERT INTO public.user_settings (
    user_id,
    email_notifications,
    push_notifications,
    sms_notifications,
    marketing_emails,
    profile_visibility,
    show_contact_info,
    allow_messages,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    true,
    true,
    false,
    false,
    'public',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create user credits
INSERT INTO public.user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    'PRO',
    1000,
    1000,
    0,
    DATE_TRUNC('month', NOW()),
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create notification preferences (if table exists)
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
    digest_frequency,
    timezone,
    badge_count_enabled,
    sound_enabled,
    vibration_enabled,
    marketplace_notifications,
    listing_notifications,
    offer_notifications,
    order_notifications,
    payment_notifications,
    review_notifications,
    dispute_notifications
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    'real-time',
    'UTC',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
) ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin user was created
SELECT 
    'Admin user created successfully!' as status,
    u.email,
    u.role,
    up.display_name,
    uc.current_balance
FROM public.users u
LEFT JOIN public.users_profile up ON u.id = up.user_id
LEFT JOIN public.user_credits uc ON u.id = uc.user_id
WHERE u.email = 'admin@preset.ie';
