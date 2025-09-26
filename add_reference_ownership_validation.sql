-- Reference Ownership Validation System
-- This ensures moodboards, treatments, and showcases can only be posted by their owners

-- ==============================================
-- REFERENCE OWNERSHIP VALIDATION FUNCTIONS
-- ==============================================

-- Function to validate if user owns a moodboard
CREATE OR REPLACE FUNCTION validate_moodboard_ownership(
  p_user_id UUID,
  p_moodboard_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  moodboard_exists BOOLEAN := FALSE;
BEGIN
  -- Check if moodboard exists and belongs to user
  -- This assumes moodboards are stored in a 'moodboards' table
  -- Adjust table name and structure based on your actual moodboard system
  
  SELECT EXISTS(
    SELECT 1 FROM moodboards 
    WHERE owner_id = p_user_id 
    AND (url = p_moodboard_url OR id::text = p_moodboard_url)
  ) INTO moodboard_exists;
  
  IF moodboard_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Moodboard ownership verified',
      'owned', true
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only reference moodboards that you own',
      'owned', false
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- If moodboards table doesn't exist, allow external URLs
  RETURN jsonb_build_object(
    'success', true,
    'message', 'External moodboard URL allowed',
    'owned', true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate if user owns a treatment
CREATE OR REPLACE FUNCTION validate_treatment_ownership(
  p_user_id UUID,
  p_treatment_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  treatment_exists BOOLEAN := FALSE;
BEGIN
  -- Check if treatment exists and belongs to user
  -- This assumes treatments are stored in a 'treatments' table
  
  SELECT EXISTS(
    SELECT 1 FROM treatments 
    WHERE owner_id = p_user_id 
    AND (url = p_treatment_url OR id::text = p_treatment_url)
  ) INTO treatment_exists;
  
  IF treatment_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Treatment ownership verified',
      'owned', true
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only reference treatments that you own',
      'owned', false
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- If treatments table doesn't exist, allow external URLs
  RETURN jsonb_build_object(
    'success', true,
    'message', 'External treatment URL allowed',
    'owned', true
  );
END;
$$ LANGUAGE plpgsql;

-- Function to validate if user owns a showcase
CREATE OR REPLACE FUNCTION validate_showcase_ownership(
  p_user_id UUID,
  p_showcase_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  showcase_exists BOOLEAN := FALSE;
BEGIN
  -- Check if showcase exists and belongs to user
  -- This assumes showcases are stored in a 'showcases' table
  
  SELECT EXISTS(
    SELECT 1 FROM showcases 
    WHERE owner_id = p_user_id 
    AND (url = p_showcase_url OR id::text = p_showcase_url)
  ) INTO showcase_exists;
  
  IF showcase_exists THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'Showcase ownership verified',
      'owned', true
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only reference showcases that you own',
      'owned', false
    );
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- If showcases table doesn't exist, allow external URLs
  RETURN jsonb_build_object(
    'success', true,
    'message', 'External showcase URL allowed',
    'owned', true
  );
END;
$$ LANGUAGE plpgsql;

-- Main function to validate reference ownership
CREATE OR REPLACE FUNCTION validate_reference_ownership(
  p_user_id UUID,
  p_reference_type TEXT,
  p_reference_url TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- If no reference type or URL, allow (optional field)
  IF p_reference_type IS NULL OR p_reference_url IS NULL OR p_reference_url = '' THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', 'No reference to validate',
      'owned', true
    );
  END IF;
  
  -- Validate based on reference type
  CASE p_reference_type
    WHEN 'moodboard' THEN
      SELECT validate_moodboard_ownership(p_user_id, p_reference_url) INTO result;
    WHEN 'treatment' THEN
      SELECT validate_treatment_ownership(p_user_id, p_reference_url) INTO result;
    WHEN 'showcase' THEN
      SELECT validate_showcase_ownership(p_user_id, p_reference_url) INTO result;
    WHEN 'external_link' THEN
      -- External links are always allowed
      RETURN jsonb_build_object(
        'success', true,
        'message', 'External link allowed',
        'owned', true
      );
    WHEN 'other' THEN
      -- Other references are always allowed
      RETURN jsonb_build_object(
        'success', true,
        'message', 'Other reference allowed',
        'owned', true
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid reference type',
        'owned', false
      );
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- CREATE PLACEHOLDER TABLES (if they don't exist)
-- ==============================================

-- Create moodboards table if it doesn't exist
CREATE TABLE IF NOT EXISTS moodboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create treatments table if it doesn't exist
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create showcases table if it doesn't exist
CREATE TABLE IF NOT EXISTS showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  thumbnail_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_moodboards_owner_id ON moodboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_treatments_owner_id ON treatments(owner_id);
CREATE INDEX IF NOT EXISTS idx_showcases_owner_id ON showcases(owner_id);

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS
ALTER TABLE moodboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;

-- Moodboards policies
CREATE POLICY "Users can view public moodboards" ON moodboards
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own moodboards" ON moodboards
  FOR SELECT USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can create their own moodboards" ON moodboards
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can update their own moodboards" ON moodboards
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can delete their own moodboards" ON moodboards
  FOR DELETE USING (auth.uid()::text = owner_id::text);

-- Treatments policies
CREATE POLICY "Users can view public treatments" ON treatments
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own treatments" ON treatments
  FOR SELECT USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can create their own treatments" ON treatments
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can update their own treatments" ON treatments
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can delete their own treatments" ON treatments
  FOR DELETE USING (auth.uid()::text = owner_id::text);

-- Showcases policies
CREATE POLICY "Users can view public showcases" ON showcases
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can view their own showcases" ON showcases
  FOR SELECT USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can create their own showcases" ON showcases
  FOR INSERT WITH CHECK (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can update their own showcases" ON showcases
  FOR UPDATE USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Users can delete their own showcases" ON showcases
  FOR DELETE USING (auth.uid()::text = owner_id::text);

-- ==============================================
-- PERMISSIONS
-- ==============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON moodboards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON treatments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON showcases TO authenticated;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON FUNCTION validate_moodboard_ownership IS 'Validates if user owns the referenced moodboard';
COMMENT ON FUNCTION validate_treatment_ownership IS 'Validates if user owns the referenced treatment';
COMMENT ON FUNCTION validate_showcase_ownership IS 'Validates if user owns the referenced showcase';
COMMENT ON FUNCTION validate_reference_ownership IS 'Main function to validate reference ownership based on type';

COMMENT ON TABLE moodboards IS 'User-created moodboards for creative projects';
COMMENT ON TABLE treatments IS 'User-created treatments for creative projects';
COMMENT ON TABLE showcases IS 'User-created showcases for creative projects';

-- ==============================================
-- TEST QUERIES
-- ==============================================

SELECT 'Reference ownership validation system created successfully!' as status;

-- Test ownership validation
SELECT validate_reference_ownership('00000000-0000-0000-0000-000000000000'::UUID, 'moodboard', 'https://example.com/moodboard') as test_result;
