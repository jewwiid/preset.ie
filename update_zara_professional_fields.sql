-- Update Zara's professional fields to increase profile completion

UPDATE users_profile
SET
  specializations = ARRAY['Commercial', 'Editorial'],
  years_experience = 3,
  hourly_rate_min = 50,
  hourly_rate_max = 150,
  typical_turnaround_days = 7
WHERE user_id = 'c39cd666-3bed-4023-b4c4-ff54c824fc88';

-- Verify the update and check new completion percentage
SELECT 
  display_name,
  primary_skill,
  specializations,
  years_experience,
  languages,
  hourly_rate_min,
  hourly_rate_max,
  typical_turnaround_days,
  profile_completion_percentage,
  updated_at
FROM users_profile
WHERE user_id = 'c39cd666-3bed-4023-b4c4-ff54c824fc88';
