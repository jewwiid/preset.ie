-- Check the specific preset data to understand what's available
-- This will help us understand why some fields show "Not specified"

-- Check the specific preset
SELECT 
    id,
    name,
    display_name,
    category,
    style_settings,
    technical_settings,
    ai_metadata,
    prompt_template,
    negative_prompt
FROM presets 
WHERE id = '23a2f340-a610-4f7e-9055-2ce9ae290580';

-- Also check if it's actually a cinematic preset
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
WHERE id = '23a2f340-a610-4f7e-9055-2ce9ae290580';

-- Check what fields are typically available in regular presets
SELECT 
    'Regular presets typically have:' as info,
    COUNT(*) as count
FROM presets 
WHERE style_settings IS NOT NULL AND style_settings != '{}';

SELECT 
    'Regular presets with technical_settings:' as info,
    COUNT(*) as count
FROM presets 
WHERE technical_settings IS NOT NULL AND technical_settings != '{}';

SELECT 
    'Regular presets with ai_metadata:' as info,
    COUNT(*) as count
FROM presets 
WHERE ai_metadata IS NOT NULL AND ai_metadata != '{}';
