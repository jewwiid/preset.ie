-- Update verification function to allow admins to verify samples for any preset
-- This allows admins to verify samples for system presets

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
    user_is_admin BOOLEAN := false;
BEGIN
    -- Get current user from JWT
    current_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM users_profile 
        WHERE user_id = current_user_id 
        AND 'ADMIN' = ANY(role_flags)
    ) INTO user_is_admin;
    
    -- Check if preset exists and user has permission (creator, admin, or system preset)
    IF NOT EXISTS (
        SELECT 1 FROM presets 
        WHERE id = preset_uuid 
        AND (
            user_id = current_user_id OR  -- User's own presets
            user_id IS NULL OR            -- System presets (anyone can verify)
            user_is_admin                 -- Admins can verify any preset
        )
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

-- Update RLS policies to allow admins to add samples
DROP POLICY IF EXISTS "Preset creators can add samples" ON preset_images;

CREATE POLICY "Preset creators and admins can add samples" ON preset_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM presets 
            WHERE id = preset_id 
            AND (
                user_id = auth.uid() OR  -- User's own presets
                user_id IS NULL OR       -- System presets (anyone can verify)
                EXISTS (                 -- Admins can verify any preset
                    SELECT 1 FROM users_profile 
                    WHERE user_id = auth.uid() 
                    AND 'ADMIN' = ANY(role_flags)
                )
            )
        )
    );

-- Update delete policy as well
DROP POLICY IF EXISTS "Preset creators can delete samples" ON preset_images;

CREATE POLICY "Preset creators and admins can delete samples" ON preset_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM presets 
            WHERE id = preset_id 
            AND (
                user_id = auth.uid() OR  -- User's own presets
                user_id IS NULL OR       -- System presets (anyone can delete)
                EXISTS (                 -- Admins can delete any preset samples
                    SELECT 1 FROM users_profile 
                    WHERE user_id = auth.uid() 
                    AND 'ADMIN' = ANY(role_flags)
                )
            )
        )
    );

-- Add comment for documentation
COMMENT ON FUNCTION add_verified_preset_sample IS 'Adds a verified sample image to a preset. Preset creators, admins, and anyone can verify system presets.';
