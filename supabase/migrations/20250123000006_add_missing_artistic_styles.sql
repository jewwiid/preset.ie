-- Add missing artistic styles to the presets table
-- These are regular presets (not cinematic) focused on artistic styles

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
  '{"artistic_period": "impressionism", "technique": "brushstrokes", "color_palette": "vibrant"}',
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
  'modern, abstract, cartoon, low quality',
  '{"style": "renaissance", "lighting": "chiaroscuro", "composition": "classical"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "renaissance", "technique": "oil_painting", "lighting": "dramatic"}',
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
  'Dramatic lighting, rich colors, emotional intensity',
  'style',
  'Create a baroque-style artwork of {subject} with dramatic lighting, rich colors, and emotional intensity',
  'minimalist, simple, muted colors, flat lighting',
  '{"style": "baroque", "lighting": "dramatic", "emotion": "intense"}',
  '{"steps": 28, "resolution": "1024x1024", "guidance_scale": 7.8}',
  '{"artistic_period": "baroque", "technique": "oil_painting", "drama": "high"}',
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
  'Geometric patterns, bold colors, luxury aesthetic',
  'style',
  'Create an art deco-style design of {subject} with geometric patterns, bold colors, and luxury aesthetic',
  'organic shapes, muted colors, rustic, vintage',
  '{"style": "art_deco", "patterns": "geometric", "aesthetic": "luxury"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "art_deco", "technique": "graphic_design", "style": "geometric"}',
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
  'Bold colors, commercial imagery, mass culture themes',
  'style',
  'Create a pop art-style artwork of {subject} with bold colors, commercial imagery, and mass culture themes',
  'subtle colors, fine art, classical, muted tones',
  '{"style": "pop_art", "colors": "bold", "theme": "commercial"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "pop_art", "technique": "screen_printing", "colors": "vibrant"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
),

-- Graffiti Style
(
  gen_random_uuid(),
  'Graffiti',
  'Urban street art, bold lettering, vibrant spray paint',
  'style',
  'Create a graffiti-style artwork of {subject} with urban street art aesthetics, bold lettering, and vibrant spray paint effects',
  'classical, fine art, subtle colors, traditional',
  '{"style": "graffiti", "medium": "spray_paint", "aesthetic": "urban"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "spray_paint", "style": "street_art"}',
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
  'Clean digital aesthetics, modern composition, vibrant colors',
  'style',
  'Create a digital art-style artwork of {subject} with clean digital aesthetics, modern composition, and vibrant colors',
  'traditional painting, brushstrokes, analog, vintage',
  '{"style": "digital_art", "medium": "digital", "aesthetic": "modern"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "style": "clean"}',
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
  'Fantasy and sci-fi themes, detailed world-building, cinematic composition',
  'style',
  'Create a concept art-style artwork of {subject} with fantasy and sci-fi themes, detailed world-building, and cinematic composition',
  'realistic, documentary, everyday, mundane',
  '{"style": "concept_art", "theme": "fantasy", "composition": "cinematic"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "genre": "fantasy"}',
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
  'Magical elements, mystical atmosphere, otherworldly beauty',
  'style',
  'Create a fantasy-style artwork of {subject} with magical elements, mystical atmosphere, and otherworldly beauty',
  'realistic, mundane, everyday, scientific',
  '{"style": "fantasy", "elements": "magical", "atmosphere": "mystical"}',
  '{"steps": 28, "resolution": "1024x1024", "guidance_scale": 7.8}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "genre": "fantasy"}',
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
  'Futuristic technology, space themes, advanced aesthetics',
  'style',
  'Create a sci-fi-style artwork of {subject} with futuristic technology, space themes, and advanced aesthetics',
  'historical, vintage, primitive, organic',
  '{"style": "sci_fi", "technology": "futuristic", "theme": "space"}',
  '{"steps": 28, "resolution": "1024x1024", "guidance_scale": 7.8}',
  '{"artistic_period": "contemporary", "technique": "digital_painting", "genre": "sci_fi"}',
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
  'Rich details, bold patterns, vibrant colors, layered composition',
  'style',
  'Create a maximalist-style artwork of {subject} with rich details, bold patterns, vibrant colors, and layered composition',
  'minimalist, simple, clean, sparse',
  '{"style": "maximalist", "details": "rich", "patterns": "bold"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "contemporary", "technique": "mixed_media", "style": "layered"}',
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
  'Dreamlike imagery, impossible combinations, subconscious themes',
  'style',
  'Create a surreal-style artwork of {subject} with dreamlike imagery, impossible combinations, and subconscious themes',
  'realistic, logical, everyday, mundane',
  '{"style": "surreal", "imagery": "dreamlike", "logic": "impossible"}',
  '{"steps": 30, "resolution": "1024x1024", "guidance_scale": 8.0}',
  '{"artistic_period": "surrealism", "technique": "oil_painting", "style": "dreamlike"}',
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
  'Clean lines, simple composition, essential elements only',
  'style',
  'Create a minimalist-style artwork of {subject} with clean lines, simple composition, and essential elements only',
  'complex, detailed, ornate, busy',
  '{"style": "minimalist", "composition": "simple", "elements": "essential"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "contemporary", "technique": "digital_design", "style": "clean"}',
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
  'Non-representational forms, color and shape focus, emotional expression',
  'style',
  'Create an abstract-style artwork of {subject} with non-representational forms, focus on color and shape, and emotional expression',
  'realistic, representational, figurative, literal',
  '{"style": "abstract", "forms": "non_representational", "focus": "color_shape"}',
  '{"steps": 25, "resolution": "1024x1024", "guidance_scale": 7.5}',
  '{"artistic_period": "abstract_expressionism", "technique": "mixed_media", "style": "non_representational"}',
  '{}',
  0,
  0,
  true,
  false,
  null,
  NOW(),
  NOW()
);

-- Update the preset count constraint to allow more presets
-- (This might need to be adjusted based on your current constraint)
