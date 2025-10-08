-- Manually trigger the profile completion recalculation
-- by updating a field to fire the BEFORE UPDATE trigger

UPDATE users_profile
SET updated_at = NOW()
WHERE user_id = 'c39cd666-3bed-4023-b4c4-ff54c824fc88';

-- Check the new completion percentage
SELECT 
  display_name,
  profile_completion_percentage,
  portfolio_url,
  website_url,
  updated_at
FROM users_profile
WHERE user_id = 'c39cd666-3bed-4023-b4c4-ff54c824fc88';
