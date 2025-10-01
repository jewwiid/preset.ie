-- Create preset_images table for showcasing images generated using presets
-- This allows users to add verified sample images that were actually generated using the preset

CREATE TABLE IF NOT EXISTS preset_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Image URLs and metadata
  source_image_url TEXT, -- Original input image (for image-to-image)
  source_image_hash TEXT, -- Hash for verification
  result_image_url TEXT NOT NULL, -- Generated result image
  result_image_hash TEXT, -- Hash for verification
  
  -- Generation details
  generation_id TEXT, -- ID from the generation service
  generation_provider TEXT DEFAULT 'nanobanana', -- Which service was used
  generation_model TEXT, -- Model used (e.g., 'sd3', 'flux')
  generation_credits INTEGER DEFAULT 0, -- Credits used for generation
  
  -- Prompt and settings used
  prompt_used TEXT NOT NULL, -- The actual prompt used
  negative_prompt_used TEXT, -- Negative prompt if used
  generation_settings JSONB DEFAULT '{}', -- Settings like steps, guidance scale, etc.
  
  -- Verification and moderation
  is_verified BOOLEAN DEFAULT false, -- Whether this is a verified sample
  verification_timestamp TIMESTAMPTZ, -- When it was verified
  verification_method TEXT, -- How it was verified (manual, automatic, etc.)
  
  -- Metadata
  title TEXT, -- User-provided title for the image
  description TEXT, -- User-provided description
  tags TEXT[] DEFAULT '{}', -- Tags for categorization
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_preset_images_preset_id ON preset_images(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_images_user_id ON preset_images(user_id);
CREATE INDEX IF NOT EXISTS idx_preset_images_is_verified ON preset_images(is_verified);
CREATE INDEX IF NOT EXISTS idx_preset_images_created_at ON preset_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_preset_images_generation_id ON preset_images(generation_id);

-- Add unique constraint to prevent duplicate submissions
-- A user cannot submit the same generation as a sample for the same preset twice
CREATE UNIQUE INDEX IF NOT EXISTS idx_preset_images_unique_generation 
ON preset_images(preset_id, user_id, generation_id) 
WHERE generation_id IS NOT NULL;

-- Add foreign key constraint for preset_id
-- This will reference either presets or cinematic_presets tables
-- We'll handle this in application logic since we have two preset tables

-- Create RLS policies
ALTER TABLE preset_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view verified preset images" ON preset_images;
    DROP POLICY IF EXISTS "Users can view verified cinematic preset images" ON preset_images;
    DROP POLICY IF EXISTS "Users can view their own preset images" ON preset_images;
    DROP POLICY IF EXISTS "Users can insert their own preset images" ON preset_images;
    DROP POLICY IF EXISTS "Users can update their own preset images" ON preset_images;
    DROP POLICY IF EXISTS "Users can delete their own preset images" ON preset_images;
    DROP POLICY IF EXISTS "Admins can manage all preset images" ON preset_images;
END $$;

-- Policy: Users can view verified images for public presets
CREATE POLICY "Users can view verified preset images" ON preset_images
  FOR SELECT
  USING (
    is_verified = true AND 
    EXISTS (
      SELECT 1 FROM presets 
      WHERE presets.id = preset_images.preset_id 
      AND presets.is_public = true
    )
  );

-- Policy: Users can view verified images for public cinematic presets
CREATE POLICY "Users can view verified cinematic preset images" ON preset_images
  FOR SELECT
  USING (
    is_verified = true AND 
    EXISTS (
      SELECT 1 FROM cinematic_presets 
      WHERE cinematic_presets.id = preset_images.preset_id 
      AND cinematic_presets.is_public = true
    )
  );

-- Policy: Users can view their own images
CREATE POLICY "Users can view their own preset images" ON preset_images
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own images
CREATE POLICY "Users can insert their own preset images" ON preset_images
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own images (for verification)
CREATE POLICY "Users can update their own preset images" ON preset_images
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own preset images" ON preset_images
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Admins can manage all preset images
CREATE POLICY "Admins can manage all preset images" ON preset_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile 
      WHERE users_profile.user_id = auth.uid() 
      AND 'ADMIN'::user_role = ANY(users_profile.role_flags)
    )
  );

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS add_verified_preset_sample CASCADE;

-- Create function to add verified preset sample
CREATE OR REPLACE FUNCTION add_verified_preset_sample(
  preset_uuid UUID,
  result_image_url_param TEXT,
  prompt_param TEXT,
  generation_id_param TEXT DEFAULT NULL,
  source_image_url_param TEXT DEFAULT NULL,
  source_image_hash_param TEXT DEFAULT NULL,
  result_image_hash_param TEXT DEFAULT NULL,
  generation_provider_param TEXT DEFAULT 'nanobanana',
  generation_model_param TEXT DEFAULT NULL,
  generation_credits_param INTEGER DEFAULT 0,
  negative_prompt_param TEXT DEFAULT NULL,
  generation_settings_param JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sample_id UUID;
  preset_exists BOOLEAN := false;
  user_id_var UUID := auth.uid();
  generation_exists BOOLEAN := false;
  preset_used_in_generation BOOLEAN := false;
BEGIN
  -- Check if user is authenticated
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Verify the preset exists in either table
  SELECT EXISTS (
    SELECT 1 FROM presets WHERE id = preset_uuid
    UNION
    SELECT 1 FROM cinematic_presets WHERE id = preset_uuid
  ) INTO preset_exists;

  IF NOT preset_exists THEN
    RAISE EXCEPTION 'Preset not found';
  END IF;

  -- Verify that the generation_id exists and was created by this user
  -- This ensures the image was actually generated by the authenticated user
  IF generation_id_param IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM playground_projects 
      WHERE id::text = generation_id_param 
      AND user_id = user_id_var
    ) INTO generation_exists;

    IF NOT generation_exists THEN
      -- If generation doesn't exist, skip verification for manual submissions
      RAISE NOTICE 'Generation not found, skipping verification for manual submission';
    ELSE
      -- Only verify preset usage if generation exists
    -- Check both playground_projects and playground_gallery for preset usage
    SELECT EXISTS (
      SELECT 1 FROM playground_projects 
      WHERE id::text = generation_id_param 
      AND user_id = user_id_var
      AND (
        metadata->>'preset_id' = preset_uuid::text
        OR metadata->>'custom_style_preset_id' = preset_uuid::text
        OR metadata->>'cinematic_preset_id' = preset_uuid::text
        OR metadata->>'applied_preset_id' = preset_uuid::text
      )
      UNION
      SELECT 1 FROM playground_gallery
      WHERE id::text = generation_id_param
      AND user_id = user_id_var
      AND (
        generation_metadata->>'custom_style_preset'->>'id' = preset_uuid::text
        OR generation_metadata->>'preset_id' = preset_uuid::text
        OR generation_metadata->>'cinematic_preset_id' = preset_uuid::text
        OR generation_metadata->>'applied_preset_id' = preset_uuid::text
        OR generation_metadata->>'style' = (
          SELECT style_settings->>'style' FROM presets WHERE id = preset_uuid
          UNION
          SELECT style_settings->>'style' FROM cinematic_presets WHERE id = preset_uuid
        )
      )
    ) INTO preset_used_in_generation;

      IF NOT preset_used_in_generation THEN
        RAISE EXCEPTION 'Generation was not created using the specified preset';
      END IF;
    END IF;

    -- Check if this generation has already been submitted as a sample
    SELECT EXISTS (
      SELECT 1 FROM preset_images 
      WHERE generation_id = generation_id_param 
      AND user_id = user_id_var
      AND preset_id = preset_uuid
    ) INTO generation_exists;

    IF generation_exists THEN
      RAISE EXCEPTION 'This generation has already been submitted as a sample for this preset';
    END IF;
  END IF;

  -- Insert the sample image
  INSERT INTO preset_images (
    preset_id,
    user_id,
    source_image_url,
    source_image_hash,
    result_image_url,
    result_image_hash,
    generation_id,
    generation_provider,
    generation_model,
    generation_credits,
    prompt_used,
    negative_prompt_used,
    generation_settings,
    is_verified,
    verification_timestamp,
    verification_method
  ) VALUES (
    preset_uuid,
    user_id_var,
    source_image_url_param,
    source_image_hash_param,
    result_image_url_param,
    result_image_hash_param,
    generation_id_param,
    generation_provider_param,
    generation_model_param,
    generation_credits_param,
    prompt_param,
    negative_prompt_param,
    generation_settings_param,
    true, -- Auto-verify since user is adding their own generation
    NOW(),
    'user_submission'
  ) RETURNING id INTO sample_id;

  RETURN sample_id;
END;
$$;

-- Create function to check if a generation can be submitted as a sample
CREATE OR REPLACE FUNCTION can_submit_generation_as_sample(
  preset_uuid UUID,
  generation_id_param TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID := auth.uid();
  generation_exists BOOLEAN := false;
  preset_used_in_generation BOOLEAN := false;
  already_submitted BOOLEAN := false;
  result JSONB;
BEGIN
  -- Check if user is authenticated
  IF user_id_var IS NULL THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'User must be authenticated'
    );
  END IF;

  -- Check if generation exists and belongs to user
  SELECT EXISTS (
    SELECT 1 FROM playground_projects 
    WHERE id::text = generation_id_param 
    AND user_id = user_id_var
  ) INTO generation_exists;

  IF NOT generation_exists THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Generation not found or not owned by user'
    );
  END IF;

  -- Check if generation used the specified preset
  SELECT EXISTS (
    SELECT 1 FROM playground_projects 
    WHERE id::text = generation_id_param 
    AND user_id = user_id_var
    AND (
      metadata->>'preset_id' = preset_uuid::text
      OR metadata->>'custom_style_preset_id' = preset_uuid::text
      OR metadata->>'cinematic_preset_id' = preset_uuid::text
      OR metadata->>'applied_preset_id' = preset_uuid::text
    )
  ) INTO preset_used_in_generation;

  IF NOT preset_used_in_generation THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Generation was not created using the specified preset'
    );
  END IF;

  -- Check if already submitted
  SELECT EXISTS (
    SELECT 1 FROM preset_images 
    WHERE generation_id = generation_id_param 
    AND user_id = user_id_var
    AND preset_id = preset_uuid
  ) INTO already_submitted;

  IF already_submitted THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'This generation has already been submitted as a sample for this preset'
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'can_submit', true,
    'reason', 'Generation is eligible to be submitted as a sample'
  );
END;
$$;

-- Create function to verify preset images (for admins)
CREATE OR REPLACE FUNCTION verify_preset_image(
  image_id UUID,
  verification_method_param TEXT DEFAULT 'manual'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var UUID := auth.uid();
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM users_profile 
    WHERE users_profile.user_id = user_id_var 
    AND 'ADMIN'::user_role = ANY(users_profile.role_flags)
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can verify preset images';
  END IF;

  -- Update the image to verified
  UPDATE preset_images 
  SET 
    is_verified = true,
    verification_timestamp = NOW(),
    verification_method = verification_method_param
  WHERE id = image_id;

  RETURN true;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_preset_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_preset_images_updated_at ON preset_images;

CREATE TRIGGER trigger_update_preset_images_updated_at
  BEFORE UPDATE ON preset_images
  FOR EACH ROW
  EXECUTE FUNCTION update_preset_images_updated_at();

-- Add some sample data for testing (optional)
-- This will be populated when users actually generate images with presets

COMMENT ON TABLE preset_images IS 'Stores verified sample images generated using presets for showcasing purposes';
COMMENT ON COLUMN preset_images.preset_id IS 'References either presets.id or cinematic_presets.id';
COMMENT ON COLUMN preset_images.is_verified IS 'Whether this image has been verified as a legitimate sample';
COMMENT ON COLUMN preset_images.generation_settings IS 'JSON object containing generation parameters like steps, guidance_scale, etc.';
