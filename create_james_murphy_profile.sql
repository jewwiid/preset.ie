-- Create profile for James Murphy
-- User ID: fc6ee0cc-0d1e-4940-81de-d579e7f0640e

-- First, check if profile exists
SELECT * FROM users_profile WHERE user_id = 'fc6ee0cc-0d1e-4940-81de-d579e7f0640e';

-- Delete existing profile if any (handle conflict)
DELETE FROM users_profile WHERE user_id = 'fc6ee0cc-0d1e-4940-81de-d579e7f0640e';
DELETE FROM users_profile WHERE handle = 'james_actor';

-- Create the profile
INSERT INTO users_profile (
    user_id,
    display_name,
    handle,
    first_name,
    last_name,
    email,
    role_flags,
    subscription_tier,
    subscription_status,
    age_verified,
    created_at,
    updated_at
) VALUES (
    'fc6ee0cc-0d1e-4940-81de-d579e7f0640e',
    'James Murphy',
    'james_actor',
    'James',
    'Murphy',
    'james.murphy@email.com',
    ARRAY['TALENT']::user_role[],
    'FREE',
    'ACTIVE',
    true,
    NOW(),
    NOW()
);

-- Verify it was created
SELECT id, user_id, display_name, handle, role_flags FROM users_profile 
WHERE user_id = 'fc6ee0cc-0d1e-4940-81de-d579e7f0640e';

