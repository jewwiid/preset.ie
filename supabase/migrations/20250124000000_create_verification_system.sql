-- Create verification system for preset samples
-- This migration sets up the complete verification workflow

-- First, ensure preset_images table has all required columns
ALTER TABLE preset_images 
ADD COLUMN IF NOT EXISTS source_image_url TEXT,
ADD COLUMN IF NOT EXISTS source_image_hash TEXT,
ADD COLUMN IF NOT EXISTS result_image_url TEXT,
ADD COLUMN IF NOT EXISTS result_image_hash TEXT,
ADD COLUMN IF NOT EXISTS generation_id TEXT,
ADD COLUMN IF NOT EXISTS generation_provider TEXT,
ADD COLUMN IF NOT EXISTS generation_model TEXT,
ADD COLUMN IF NOT EXISTS generation_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prompt_used TEXT,
ADD COLUMN IF NOT EXISTS negative_prompt_used TEXT,
ADD COLUMN IF NOT EXISTS generation_settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_preset_images_preset_id ON preset_images(preset_id);
CREATE INDEX IF NOT EXISTS idx_preset_images_verified ON preset_images(is_verified);

-- Create the verification function
CREATE OR REPLACE FUNCTION add_verified_preset_sample(
    preset_uuid UUID,
    source_image_url_param TEXT,
    source_image_hash_param TEXT,
    result_image_url_param TEXT,
    result_image_hash_param TEXT,
    generation_id_param TEXT,
    generation_provider_param TEXT,
    generation_model_param TEXT,
    generation_credits_param INTEGER,
    prompt_param TEXT,
    negative_prompt_param TEXT,
    generation_settings_param JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_sample_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user from JWT
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if preset exists and user has permission (creator or admin)
    IF NOT EXISTS (
        SELECT 1 FROM presets 
        WHERE id = preset_uuid 
        AND (user_id = current_user_id OR user_id IS NULL) -- System presets or user's own presets
    ) THEN
        RAISE EXCEPTION 'User does not have permission to add samples to this preset';
    END IF;
    
    -- Insert the verified sample
    INSERT INTO preset_images (
        preset_id,
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
        verified_by,
        created_at
    ) VALUES (
        preset_uuid,
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
        true,
        NOW(),
        current_user_id,
        NOW()
    ) RETURNING id INTO new_sample_id;
    
    RETURN new_sample_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_verified_preset_sample TO authenticated;

-- Add RLS policies for preset_images
ALTER TABLE preset_images ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all verified samples
CREATE POLICY "Users can read verified samples" ON preset_images
    FOR SELECT USING (is_verified = true);

-- Policy: Preset creators can add samples
CREATE POLICY "Preset creators can add samples" ON preset_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM presets 
            WHERE id = preset_id 
            AND (user_id = auth.uid() OR user_id IS NULL)
        )
    );

-- Policy: Preset creators can delete their own samples
CREATE POLICY "Preset creators can delete samples" ON preset_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM presets 
            WHERE id = preset_id 
            AND (user_id = auth.uid() OR user_id IS NULL)
        )
    );

-- Add comment for documentation
COMMENT ON FUNCTION add_verified_preset_sample IS 'Adds a verified sample image to a preset. Only preset creators can add samples.';
COMMENT ON TABLE preset_images IS 'Stores verified sample images for presets with full generation metadata.';
