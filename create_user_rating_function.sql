-- Create function to calculate user average rating
CREATE OR REPLACE FUNCTION get_user_average_rating(user_id UUID)
RETURNS DECIMAL(3,2) AS $$
BEGIN
  RETURN (
    SELECT COALESCE(AVG(rating)::DECIMAL(3,2), 0.0)
    FROM marketplace_reviews 
    WHERE subject_user_id = user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get user rating with count
CREATE OR REPLACE FUNCTION get_user_rating_info(user_id UUID)
RETURNS TABLE(
  average_rating DECIMAL(3,2),
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::DECIMAL(3,2), 0.0) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM marketplace_reviews 
  WHERE subject_user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT 'User rating functions created successfully!' as status;
