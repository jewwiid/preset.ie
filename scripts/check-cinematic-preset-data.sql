-- Check what data is actually in the cinematic presets
-- This will help us understand why the frontend shows "Not specified"

-- Check the specific preset that's not showing details
SELECT 
    id,
    name,
    display_name,
    description,
    category,
    parameters,
    style_settings,
    technical_settings,
    ai_metadata,
    seedream_config,
    generation_mode,
    user_id
FROM cinematic_presets 
WHERE id = '454bb50a-9a13-48a8-bce6-c0f26bbf0a4d';

-- Check all cinematic presets to see the data structure
SELECT 
    id,
    name,
    display_name,
    category,
    parameters,
    style_settings,
    technical_settings,
    ai_metadata
FROM cinematic_presets 
ORDER BY sort_order;

-- Check what's in the parameters field (this might contain the style/mood/resolution data)
SELECT 
    name,
    display_name,
    parameters
FROM cinematic_presets 
WHERE parameters IS NOT NULL
ORDER BY sort_order;
