-- Verify James Murphy's profile IDs
SELECT 
  id as profile_id,
  user_id as auth_user_id,
  display_name,
  handle,
  created_at
FROM users_profile
WHERE handle = 'james_actor' OR display_name = 'James Murphy';

-- Check if the specific ID exists
SELECT 
  id,
  user_id,
  display_name,
  handle
FROM users_profile
WHERE id = '6a934ebb-ae21-4e4a-9c4f-c8c287cd6add';

