-- Set your user as admin using role_flags array
-- Replace 'preset' with your actual handle

UPDATE users_profile
SET role_flags = ARRAY['ADMIN']::user_role[]
WHERE handle = 'preset';

-- Verify the change
SELECT user_id, handle, display_name, role_flags
FROM users_profile
WHERE handle = 'preset';
