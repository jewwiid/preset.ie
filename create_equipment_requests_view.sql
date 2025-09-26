-- Create a view that includes user ratings for equipment requests
CREATE OR REPLACE VIEW equipment_requests_with_ratings AS
SELECT 
  er.*,
  up.id as requester_profile_id,
  up.display_name as requester_display_name,
  up.handle as requester_handle,
  up.avatar_url as requester_avatar_url,
  up.verified_id as requester_verified_id,
  COALESCE(
    (SELECT AVG(rating)::DECIMAL(3,2) 
     FROM marketplace_reviews 
     WHERE subject_user_id = up.id), 
    0.0
  ) as requester_average_rating,
  COALESCE(
    (SELECT COUNT(*)::INTEGER 
     FROM marketplace_reviews 
     WHERE subject_user_id = up.id), 
    0
  ) as requester_review_count
FROM equipment_requests er
LEFT JOIN users_profile up ON er.requester_id = up.id;

-- Grant permissions
GRANT SELECT ON equipment_requests_with_ratings TO anon;
GRANT SELECT ON equipment_requests_with_ratings TO authenticated;
GRANT SELECT ON equipment_requests_with_ratings TO service_role;

-- Test the view
SELECT 'Equipment requests view with ratings created successfully!' as status;
