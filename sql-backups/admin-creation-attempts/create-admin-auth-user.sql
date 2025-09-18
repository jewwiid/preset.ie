-- Create the admin user in auth.users table with proper authentication setup
-- This is the core authentication record that Supabase needs

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
);

-- Verify the user was created
SELECT 
    'Admin user created in auth.users!' as status,
    id,
    email,
    email_confirmed_at,
    encrypted_password IS NOT NULL as has_password,
    created_at
FROM auth.users 
WHERE email = 'admin@preset.ie';
