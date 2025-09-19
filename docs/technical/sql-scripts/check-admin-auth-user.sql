-- Check the admin user in auth.users table
SELECT 
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'admin@preset.ie';
