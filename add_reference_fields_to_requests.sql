-- Add Reference Fields to Equipment Requests
-- This adds fields for moodboards, treatments, showcases, and external links

-- ==============================================
-- ADD REFERENCE FIELDS TO EQUIPMENT_REQUESTS TABLE
-- ==============================================

-- Add reference fields to equipment_requests table
ALTER TABLE equipment_requests 
ADD COLUMN IF NOT EXISTS reference_type TEXT CHECK (reference_type IN ('moodboard', 'treatment', 'showcase', 'external_link', 'other')),
ADD COLUMN IF NOT EXISTS reference_title TEXT,
ADD COLUMN IF NOT EXISTS reference_url TEXT,
ADD COLUMN IF NOT EXISTS reference_description TEXT,
ADD COLUMN IF NOT EXISTS reference_thumbnail_url TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_equipment_requests_reference_type ON equipment_requests(reference_type);

-- ==============================================
-- UPDATE EQUIPMENT_REQUESTS_WITH_RATINGS VIEW
-- ==============================================

-- Drop the existing view
DROP VIEW IF EXISTS equipment_requests_with_ratings;

-- Recreate the view with reference information
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
  ) as requester_review_count,
  -- Purpose information
  erp.name as purpose_name,
  erp.display_name as purpose_display_name,
  erp.description as purpose_description,
  erp.icon as purpose_icon,
  erp.category as purpose_category
FROM equipment_requests er
LEFT JOIN users_profile up ON er.requester_id = up.id
LEFT JOIN equipment_request_purposes erp ON er.purpose_id = erp.id;

-- ==============================================
-- HELPER FUNCTIONS FOR REFERENCE VALIDATION
-- ==============================================

-- Function to validate reference URL
CREATE OR REPLACE FUNCTION validate_reference_url(p_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if URL is valid format
  IF p_url IS NULL OR p_url = '' THEN
    RETURN TRUE; -- Allow empty URLs
  END IF;
  
  -- Basic URL validation
  IF p_url ~ '^https?://[^\s/$.?#].[^\s]*$' THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate reference data
CREATE OR REPLACE FUNCTION validate_reference_data(
  p_reference_type TEXT,
  p_reference_title TEXT,
  p_reference_url TEXT,
  p_reference_description TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Validate reference type
  IF p_reference_type IS NOT NULL AND p_reference_type NOT IN ('moodboard', 'treatment', 'showcase', 'external_link', 'other') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid reference type. Must be one of: moodboard, treatment, showcase, external_link, other'
    );
  END IF;
  
  -- If reference type is provided, title is required
  IF p_reference_type IS NOT NULL AND (p_reference_title IS NULL OR TRIM(p_reference_title) = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reference title is required when reference type is specified'
    );
  END IF;
  
  -- Validate URL if provided
  IF p_reference_url IS NOT NULL AND p_reference_url != '' THEN
    IF NOT validate_reference_url(p_reference_url) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid URL format. Please provide a valid HTTP/HTTPS URL'
      );
    END IF;
  END IF;
  
  -- Validate title length
  IF p_reference_title IS NOT NULL AND LENGTH(p_reference_title) > 200 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reference title must be 200 characters or less'
    );
  END IF;
  
  -- Validate description length
  IF p_reference_description IS NOT NULL AND LENGTH(p_reference_description) > 1000 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Reference description must be 1000 characters or less'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Reference data is valid'
  );
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON COLUMN equipment_requests.reference_type IS 'Type of reference: moodboard, treatment, showcase, external_link, or other';
COMMENT ON COLUMN equipment_requests.reference_title IS 'Title of the reference material';
COMMENT ON COLUMN equipment_requests.reference_url IS 'URL to the reference material';
COMMENT ON COLUMN equipment_requests.reference_description IS 'Description of the reference material';
COMMENT ON COLUMN equipment_requests.reference_thumbnail_url IS 'URL to thumbnail/preview image of the reference';

COMMENT ON FUNCTION validate_reference_url IS 'Validates if a URL has proper format';
COMMENT ON FUNCTION validate_reference_data IS 'Validates all reference data fields';

-- ==============================================
-- TEST QUERIES
-- ==============================================

-- Test the reference validation functions
SELECT 'Reference fields added successfully!' as status;

-- Test URL validation
SELECT 
  validate_reference_url('https://example.com') as valid_url,
  validate_reference_url('invalid-url') as invalid_url,
  validate_reference_url('') as empty_url;

-- Test reference data validation
SELECT validate_reference_data('moodboard', 'Wedding Moodboard', 'https://example.com/moodboard', 'Beautiful wedding inspiration') as valid_data;
SELECT validate_reference_data('invalid_type', 'Title', 'https://example.com', 'Description') as invalid_type;
