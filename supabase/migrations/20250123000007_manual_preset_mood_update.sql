-- Manual Database Update: Add mood fields to existing presets and add missing artistic styles
-- Execute this in Supabase Dashboard SQL Editor

-- Step 1: Update existing presets with mood fields
UPDATE presets 
SET ai_metadata = ai_metadata || '{"mood": "Dramatic"}'::jsonb
WHERE name = 'Graffiti';

UPDATE presets 
SET ai_metadata = ai_metadata || '{"mood": "Serene"}'::jsonb
WHERE name = 'Artistic Watercolor';

UPDATE presets 
SET ai_metadata = ai_metadata || '{"mood": "Epic"}'::jsonb
WHERE name = 'Cinematic Landscape';

UPDATE presets 
SET ai_metadata = ai_metadata || '{"mood": "Professional"}'::jsonb
WHERE name = 'Technical Diagram';

-- Step 2: Add missing artistic styles presets with mood fields
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
  likes_count,
  is_public,
  is_featured,
  user_id,
  created_at,
  updated_at
) VALUES 
-- Impressionist Style
(
  gen_random_uuid(),
  'Impressionist',
  'Soft brushstrokes, vibrant colors, capturing light and movement',
  'style',
  'Create an impressionist painting of {subject} with loose brushstrokes, vibrant colors, and emphasis on light and atmosphere',
  'photorealistic, detailed, sharp edges, dark colors',
  '{"style": "impressionist", "brushwork": "loose", "color_vibrancy": "high"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "impressionism", "technique": "brushstrokes", "color_palette": "vibrant", "mood": "Serene"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Renaissance Style
(
  gen_random_uuid(),
  'Renaissance',
  'Classical composition, chiaroscuro lighting, detailed realism',
  'style',
  'Create a renaissance-style painting of {subject} with classical composition, chiaroscuro lighting, and detailed realism',
  'modern, abstract, flat colors, cartoon',
  '{"style": "renaissance", "composition": "classical", "lighting": "chiaroscuro"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "renaissance", "technique": "oil_painting", "color_palette": "classical", "mood": "Majestic"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Baroque Style
(
  gen_random_uuid(),
  'Baroque',
  'Dramatic lighting, rich colors, ornate details',
  'style',
  'Create a baroque-style painting of {subject} with dramatic lighting, rich colors, and ornate details',
  'minimalist, simple, flat lighting',
  '{"style": "baroque", "lighting": "dramatic", "details": "ornate"}',
  '{"steps": 28, "resolution": "1024x1024", "guidance_scale": 7.8}',
  '{"artistic_period": "baroque", "technique": "oil_painting", "color_palette": "rich", "mood": "Dramatic"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Art Deco Style
(
  gen_random_uuid(),
  'Art Deco',
  'Geometric patterns, bold colors, elegant symmetry',
  'style',
  'Create an art deco-style design of {subject} with geometric patterns, bold colors, and elegant symmetry',
  'organic, asymmetrical, muted colors',
  '{"style": "art_deco", "patterns": "geometric", "symmetry": "elegant"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "art_deco", "technique": "graphic_design", "color_palette": "bold", "mood": "Elegant"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Pop Art Style
(
  gen_random_uuid(),
  'Pop Art',
  'Bold colors, commercial imagery, vibrant contrast',
  'style',
  'Create a pop art-style image of {subject} with bold colors, commercial imagery, and vibrant contrast',
  'subtle, muted, realistic, natural',
  '{"style": "pop_art", "colors": "bold", "imagery": "commercial"}',
  '{"steps": 22, "resolution": "1024x1024", "guidance_scale": 7.0}',
  '{"artistic_period": "pop_art", "technique": "screen_printing", "color_palette": "vibrant", "mood": "Energetic"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Digital Art Style
(
  gen_random_uuid(),
  'Digital Art',
  'Modern digital techniques, clean lines, vibrant colors',
  'style',
  'Create a digital art piece of {subject} with modern digital techniques, clean lines, and vibrant colors',
  'traditional, hand-drawn, rough, analog',
  '{"style": "digital", "technique": "digital_painting", "lines": "clean"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "color_palette": "vibrant", "mood": "Modern"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Concept Art Style
(
  gen_random_uuid(),
  'Concept Art',
  'Fantasy and sci-fi themes, detailed world-building',
  'style',
  'Create a concept art piece of {subject} with fantasy and sci-fi themes, detailed world-building',
  'realistic, documentary, mundane',
  '{"style": "concept_art", "themes": "fantasy_sci_fi", "world_building": "detailed"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "color_palette": "fantasy", "mood": "Epic"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Fantasy Style
(
  gen_random_uuid(),
  'Fantasy',
  'Magical elements, mystical atmosphere, enchanting colors',
  'style',
  'Create a fantasy artwork of {subject} with magical elements, mystical atmosphere, and enchanting colors',
  'realistic, mundane, scientific, modern',
  '{"style": "fantasy", "elements": "magical", "atmosphere": "mystical"}',
  '{"steps": 28, "resolution": "1024x1024", "guidance_scale": 7.8}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "color_palette": "mystical", "mood": "Enchanting"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Sci-Fi Style
(
  gen_random_uuid(),
  'Sci-Fi',
  'Futuristic technology, neon lights, cyberpunk aesthetics',
  'style',
  'Create a sci-fi artwork of {subject} with futuristic technology, neon lights, and cyberpunk aesthetics',
  'historical, vintage, organic, natural',
  '{"style": "sci_fi", "technology": "futuristic", "aesthetics": "cyberpunk"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "color_palette": "neon", "mood": "Futuristic"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Maximalist Style
(
  gen_random_uuid(),
  'Maximalist',
  'Rich details, bold patterns, vibrant colors',
  'style',
  'Create a maximalist design of {subject} with rich details, bold patterns, and vibrant colors',
  'minimalist, simple, clean, sparse',
  '{"style": "maximalist", "details": "rich", "patterns": "bold"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "mixed_media", "color_palette": "vibrant", "mood": "Bold"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Surreal Style
(
  gen_random_uuid(),
  'Surreal',
  'Dreamlike imagery, impossible combinations, mysterious atmosphere',
  'style',
  'Create a surreal artwork of {subject} with dreamlike imagery, impossible combinations, and mysterious atmosphere',
  'realistic, logical, ordinary, mundane',
  '{"style": "surreal", "imagery": "dreamlike", "combinations": "impossible"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "color_palette": "mysterious", "mood": "Mysterious"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Minimalist Style
(
  gen_random_uuid(),
  'Minimalist',
  'Clean lines, simple forms, subtle colors',
  'style',
  'Create a minimalist design of {subject} with clean lines, simple forms, and subtle colors',
  'complex, ornate, busy, cluttered',
  '{"style": "minimalist", "lines": "clean", "forms": "simple"}',
  '{"steps": 20, "resolution": "1024x1024", "guidance_scale": 6.5}',
  '{"artistic_period": "contemporary", "technique": "digital_design", "color_palette": "subtle", "mood": "Calm"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Abstract Style
(
  gen_random_uuid(),
  'Abstract',
  'Non-representational forms, bold colors, expressive brushwork',
  'style',
  'Create an abstract artwork of {subject} with non-representational forms, bold colors, and expressive brushwork',
  'realistic, representational, literal, figurative',
  '{"style": "abstract", "forms": "non_representational", "brushwork": "expressive"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "mixed_media", "color_palette": "bold", "mood": "Expressive"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
);

-- Step 3: Verify the updates
-- Check that mood fields were added successfully
SELECT name, ai_metadata->>'mood' as mood, ai_metadata 
FROM presets 
WHERE ai_metadata->>'mood' IS NOT NULL
ORDER BY name;

-- Count total presets
SELECT COUNT(*) as total_presets FROM presets;

-- Count presets with mood fields
SELECT COUNT(*) as presets_with_mood 
FROM presets 
WHERE ai_metadata->>'mood' IS NOT NULL;
