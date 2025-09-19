-- Migration: Consolidate StylePresets into Comprehensive Presets
-- This migration moves existing playground_style_presets to the comprehensive presets table

-- First, let's see what data we're working with
DO $$
DECLARE
    style_preset_count INTEGER;
    comprehensive_preset_count INTEGER;
BEGIN
    -- Count existing style presets
    SELECT COUNT(*) INTO style_preset_count FROM playground_style_presets;
    
    -- Count existing comprehensive presets
    SELECT COUNT(*) INTO comprehensive_preset_count FROM presets;
    
    RAISE NOTICE 'Found % style presets and % comprehensive presets', style_preset_count, comprehensive_preset_count;
END $$;

-- Migrate existing style presets to comprehensive presets
INSERT INTO presets (
    id,
    name,
    description,
    category,
    prompt_template,
    negative_prompt,
    style_settings,
    technical_settings,
    ai_metadata,
    seedream_config,
    usage_count,
    is_public,
    is_featured,
    created_at,
    updated_at,
    user_id
)
SELECT 
    -- Generate new UUID for comprehensive preset
    gen_random_uuid() as id,
    
    -- Map basic fields
    sp.name,
    sp.description,
    
    -- Map style_type to category
    CASE 
        WHEN sp.style_type = 'photorealistic' THEN 'style'
        WHEN sp.style_type = 'artistic' THEN 'style'
        WHEN sp.style_type = 'cartoon' THEN 'style'
        WHEN sp.style_type = 'vintage' THEN 'style'
        WHEN sp.style_type = 'cyberpunk' THEN 'style'
        WHEN sp.style_type = 'watercolor' THEN 'style'
        WHEN sp.style_type = 'sketch' THEN 'style'
        WHEN sp.style_type = 'oil_painting' THEN 'style'
        ELSE 'custom'
    END as category,
    
    -- Map prompt template
    sp.prompt_template,
    
    -- No negative prompt in style presets
    NULL as negative_prompt,
    
    -- Create style_settings JSON from style preset data
    jsonb_build_object(
        'style', sp.style_type,
        'intensity', COALESCE(sp.intensity, 1.0),
        'consistency_level', 'high',
        'generation_mode', COALESCE(sp.generation_mode, 'text-to-image')
    ) as style_settings,
    
    -- Create technical_settings with defaults
    jsonb_build_object(
        'resolution', '1024',
        'aspect_ratio', '1:1',
        'num_images', 1,
        'quality', 'high'
    ) as technical_settings,
    
    -- Create ai_metadata
    jsonb_build_object(
        'model_version', 'latest',
        'generation_mode', COALESCE(sp.generation_mode, 'text-to-image'),
        'migrated_from_style_preset', true,
        'original_style_preset_id', sp.id
    ) as ai_metadata,
    
    -- Create seedream_config with defaults
    jsonb_build_object(
        'model', 'seedream',
        'steps', 20,
        'guidance_scale', 7.5,
        'scheduler', 'euler'
    ) as seedream_config,
    
    -- Map usage count
    COALESCE(sp.usage_count, 0) as usage_count,
    
    -- Map public setting
    COALESCE(sp.is_public, false) as is_public,
    
    -- Not featured by default (can be manually promoted later)
    false as is_featured,
    
    -- Map timestamps
    COALESCE(sp.created_at, NOW()) as created_at,
    NOW() as updated_at,
    
    -- Map creator
    sp.user_id as user_id

FROM playground_style_presets sp
WHERE NOT EXISTS (
    -- Avoid duplicates - check if a preset with similar name and prompt already exists
    SELECT 1 FROM presets p 
    WHERE p.name = sp.name 
    AND p.prompt_template = sp.prompt_template
    AND p.user_id = sp.user_id
);

-- Note: Creator information is already available via user_id foreign key relationship

-- Add a comment to track the migration
COMMENT ON TABLE presets IS 'Comprehensive presets table - migrated from playground_style_presets in migration 099';

-- Create an index for better performance on migrated presets
CREATE INDEX IF NOT EXISTS idx_presets_migrated_from_style 
ON presets USING GIN (ai_metadata);

-- Show migration results
DO $$
DECLARE
    migrated_count INTEGER;
    total_comprehensive_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO migrated_count 
    FROM presets 
    WHERE ai_metadata->>'migrated_from_style_preset' = 'true';
    
    SELECT COUNT(*) INTO total_comprehensive_count FROM presets;
    
    RAISE NOTICE 'Migration completed: % style presets migrated to comprehensive presets', migrated_count;
    RAISE NOTICE 'Total comprehensive presets: %', total_comprehensive_count;
END $$;
