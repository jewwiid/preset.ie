-- Complete Zara's profile to near 100% by adding remaining relevant fields
-- Adding portfolio, website, and travel preferences

UPDATE users_profile
SET
  portfolio_url = 'https://www.zaraahmed.com/portfolio',
  website_url = 'https://www.zaraahmed.com',
  available_for_travel = true
WHERE user_id = 'c39cd666-3bed-4023-b4c4-ff54c824fc88';

-- Verify the update
SELECT 
  display_name,
  profile_completion_percentage,
  portfolio_url,
  website_url,
  available_for_travel,
  updated_at
FROM users_profile
WHERE user_id = 'c39cd666-3bed-4023-b4c4-ff54c824fc88';
