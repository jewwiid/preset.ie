-- Test UUID generation and gig invitations table
-- This will help us debug the issue

-- Test 1: Check if gen_random_uuid() works
SELECT gen_random_uuid() AS test_uuid;

-- Test 2: Check the gig_invitations table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'gig_invitations'
ORDER BY ordinal_position;

-- Test 3: Try a simple insert to test UUID generation
-- First, let's get the user IDs we need
SELECT 
  up.id as inviter_id,
  up.user_id as inviter_user_id,
  up.display_name as inviter_name
FROM users_profile up 
WHERE up.user_id = 'df080138-907f-4742-b1a9-1ee47441e404' -- Sarah's user_id
LIMIT 1;

SELECT 
  up.id as invitee_id,
  up.user_id as invitee_user_id,
  up.display_name as invitee_name
FROM users_profile up 
WHERE up.handle = 'james_actor'
LIMIT 1;

-- Test 4: Check if the gig exists
SELECT 
  id,
  title,
  owner_user_id,
  status
FROM gigs 
WHERE id = '722fc087-0e13-4dbd-a608-51c50fe32241'
LIMIT 1;
