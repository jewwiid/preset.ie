-- Reset the admin user password to ensure it's properly encrypted
UPDATE auth.users 
SET 
    encrypted_password = crypt('Admin123!@#', gen_salt('bf')),
    updated_at = NOW()
WHERE email = 'admin@preset.ie';

-- Verify the password was updated
SELECT 
    'Password updated for admin user!' as status,
    email,
    encrypted_password IS NOT NULL as has_password,
    updated_at
FROM auth.users 
WHERE email = 'admin@preset.ie';
