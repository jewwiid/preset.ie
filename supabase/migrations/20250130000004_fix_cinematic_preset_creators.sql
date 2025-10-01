-- Fix cinematic preset creators to use a dedicated preset admin user
-- This migration addresses the issue where cinematic presets show "System" instead of a proper creator

-- ==============================================
-- STEP 1: Create a dedicated preset admin user
-- ==============================================

-- Insert a system user for preset management (if it doesn't exist)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    app_metadata,
    user_metadata,
    is_super_admin,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    deleted_at,
    is_anonymous,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Fixed UUID for preset admin
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'preset-admin@preset.ie',
    crypt('preset-admin-password', gen_salt('bf')), -- You should change this
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Preset Admin", "avatar_url": null}',
    false,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Preset Admin"}',
    false,
    null,
    false,
    null,
    null,
    '',
    '',
    '',
    '',
    0,
    '',
    null,
    false
) ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- STEP 2: Create the corresponding user profile
-- ==============================================

INSERT INTO users_profile (
    id,
    user_id,
    display_name,
    handle,
    bio,
    avatar_url,
    website,
    location,
    city,
    country,
    state_province,
    role_flags,
    style_tags,
    subscription_tier,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001', -- Same ID as user
    '00000000-0000-0000-0000-000000000001', -- Same as user ID
    'Preset Admin',
    'preset',
    'Official Preset team account for system-generated presets',
    null,
    'https://preset.ie',
    'Ireland',
    'Dublin',
    'Ireland',
    'Dublin',
    ARRAY['ADMIN']::user_role[], -- Admin role
    ARRAY['system', 'cinematic', 'professional']::text[],
    'PRO'::subscription_tier,
    'ACTIVE'::subscription_status,
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    handle = EXCLUDED.handle,
    bio = EXCLUDED.bio,
    role_flags = EXCLUDED.role_flags,
    updated_at = NOW();

-- ==============================================
-- STEP 3: Update cinematic presets to use the preset admin user
-- ==============================================

UPDATE cinematic_presets 
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id IS NULL;

-- ==============================================
-- STEP 4: Verify the fix
-- ==============================================

-- Show the updated cinematic presets
SELECT 
    id,
    name,
    display_name,
    user_id,
    CASE 
        WHEN user_id IS NOT NULL THEN 'Fixed - Will show Preset Admin'
        ELSE 'Still NULL - Will show System'
    END as creator_status
FROM cinematic_presets 
ORDER BY sort_order;

-- ==============================================
-- STEP 5: Add comments for documentation
-- ==============================================

COMMENT ON COLUMN cinematic_presets.user_id IS 'User who created the preset. NULL for legacy system presets (now updated to use preset admin), or actual user_id for user-created presets';
COMMENT ON TABLE users_profile IS 'User profiles including system accounts like Preset Admin for cinematic presets';

-- ==============================================
-- Migration completed successfully
-- ==============================================
