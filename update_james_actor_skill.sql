-- Update James Murphy's profile to add the Actor primary skill
UPDATE users_profile
SET 
    primary_skill = 'Actor',
    talent_categories = ARRAY['Actor']::text[],
    accepts_tfp = false,
    prefers_studio = true,
    prefers_outdoor = true,
    available_weekdays = true,
    available_weekends = true,
    updated_at = NOW()
WHERE handle = 'james_actor';

-- Verify the update
SELECT 
    display_name,
    handle,
    primary_skill,
    talent_categories,
    accepts_tfp,
    prefers_outdoor,
    available_weekends
FROM users_profile 
WHERE handle = 'james_actor';

