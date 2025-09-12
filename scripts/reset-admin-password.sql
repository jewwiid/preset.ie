-- Reset admin password directly in the database
-- This updates the encrypted password for admin@preset.ie

-- First, let's check if the user exists
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@preset.ie';

-- Update the password (this is the encrypted version of 'Admin123!@#')
-- Note: This is a bcrypt hash of the password
UPDATE auth.users 
SET encrypted_password = crypt('Admin123!@#', gen_salt('bf'))
WHERE email = 'admin@preset.ie';

-- Verify the update
SELECT id, email, updated_at FROM auth.users WHERE email = 'admin@preset.ie';