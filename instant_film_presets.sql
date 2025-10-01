-- Instant Film Photography Presets
-- Comprehensive collection of instant film styles for AI image generation
-- Based on popular instant film cameras: Polaroid, Fujifilm Instax, etc.

INSERT INTO presets (
  id,
  user_id,
  name,
  description,
  category,
  prompt_template,
  negative_prompt,
  style_settings,
  technical_settings,
  ai_metadata,
  seedream_config,
  generation_mode,
  is_public,
  is_featured,
  usage_count,
  created_at,
  updated_at
) VALUES 

-- Polaroid Originals (Classic White Border)
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Polaroid Originals Classic',
  'Classic Polaroid instant film with iconic white border, warm tones, and vintage charm. Perfect for nostalgic, authentic moments.',
  'style',
  'Instant film photograph of {subject}, Polaroid Originals style, white border frame, warm color palette, vintage instant camera aesthetic, nostalgic mood, authentic film grain, classic instant photography',
  'digital, high resolution, sharp focus, modern camera, professional lighting, studio quality',
  '{"style": "polaroid_originals", "lighting": "natural", "background": "vintage", "composition": "instant", "generation_mode": "text-to-image", "film_type": "instant", "border": "white", "color_tone": "warm"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "nostalgic_photography", "optimized_for": "vintage aesthetic", "preset_type": "instant_film", "mood": "Nostalgic", "tags": ["polaroid", "instant", "vintage", "film", "nostalgic", "warm"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Polaroid 600 Series
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Polaroid 600 Series',
  'Classic Polaroid 600 instant film with distinctive white borders, saturated colors, and authentic film texture.',
  'style',
  'Polaroid 600 instant photograph of {subject}, classic white border, saturated colors, authentic film texture, instant camera aesthetic, vintage charm, film grain, classic instant photography style',
  'digital, modern, high resolution, sharp, professional, studio, clean',
  '{"style": "polaroid_600", "lighting": "natural", "background": "vintage", "composition": "instant", "generation_mode": "text-to-image", "film_type": "instant", "border": "white", "color_saturation": "high"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "classic_instant", "optimized_for": "vintage photography", "preset_type": "instant_film", "mood": "Classic", "tags": ["polaroid", "600", "instant", "vintage", "saturated", "classic"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Fujifilm Instax Mini
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Fujifilm Instax Mini',
  'Clean, bright Fujifilm Instax Mini instant film with crisp white borders and vibrant, accurate colors.',
  'style',
  'Fujifilm Instax Mini instant photograph of {subject}, clean white border, bright vibrant colors, crisp instant film aesthetic, modern instant camera style, sharp instant photography',
  'vintage, faded, low contrast, dark, film grain, aged, nostalgic',
  '{"style": "instax_mini", "lighting": "bright", "background": "clean", "composition": "crisp", "generation_mode": "text-to-image", "film_type": "instant", "border": "white", "color_accuracy": "high"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "modern_instant", "optimized_for": "clean instant photography", "preset_type": "instant_film", "mood": "Bright", "tags": ["instax", "mini", "instant", "clean", "bright", "modern"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Fujifilm Instax Wide
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Fujifilm Instax Wide',
  'Wide format Fujifilm Instax with larger frame, vibrant colors, and excellent color reproduction.',
  'style',
  'Fujifilm Instax Wide instant photograph of {subject}, wide format white border, vibrant colors, large instant film aesthetic, wide instant camera style, excellent color reproduction',
  'narrow format, small, faded, low quality, dark, vintage grain',
  '{"style": "instax_wide", "lighting": "natural", "background": "wide", "composition": "landscape", "generation_mode": "text-to-image", "film_type": "instant", "border": "white", "format": "wide"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "4:3"}',
  '{"specialization": "instant_film", "use_case": "wide_format_instant", "optimized_for": "landscape instant photography", "preset_type": "instant_film", "mood": "Vibrant", "tags": ["instax", "wide", "instant", "landscape", "vibrant", "format"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Polaroid SX-70
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Polaroid SX-70 Vintage',
  'Classic SX-70 instant film with soft colors, vintage aesthetic, and distinctive square format.',
  'style',
  'Polaroid SX-70 instant photograph of {subject}, vintage square format, soft muted colors, classic instant film aesthetic, retro instant camera style, vintage charm, authentic film look',
  'bright, saturated, modern, digital, sharp, high contrast, clean',
  '{"style": "sx70", "lighting": "soft", "background": "vintage", "composition": "square", "generation_mode": "text-to-image", "film_type": "instant", "format": "square", "color_tone": "muted"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "vintage_instant", "optimized_for": "retro photography", "preset_type": "instant_film", "mood": "Vintage", "tags": ["sx70", "polaroid", "vintage", "square", "muted", "retro"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Polaroid Spectra
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Polaroid Spectra Wide',
  'Unique Polaroid Spectra wide format with distinctive borders and rich color palette.',
  'style',
  'Polaroid Spectra instant photograph of {subject}, wide format with distinctive borders, rich color palette, unique instant film aesthetic, vintage wide instant camera style',
  'standard format, narrow, faded, low quality, digital, modern',
  '{"style": "spectra", "lighting": "natural", "background": "wide", "composition": "wide", "generation_mode": "text-to-image", "film_type": "instant", "format": "spectra", "border": "distinctive"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "4:3"}',
  '{"specialization": "instant_film", "use_case": "spectra_format", "optimized_for": "unique wide instant", "preset_type": "instant_film", "mood": "Unique", "tags": ["spectra", "polaroid", "wide", "unique", "distinctive", "rich"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Polaroid Go
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Polaroid Go Modern',
  'Modern Polaroid Go instant film with compact format, crisp colors, and contemporary instant photography style.',
  'style',
  'Polaroid Go instant photograph of {subject}, compact modern format, crisp clean colors, contemporary instant camera aesthetic, modern instant photography style, sharp instant film',
  'vintage, faded, large format, grainy, aged, retro, soft',
  '{"style": "polaroid_go", "lighting": "natural", "background": "modern", "composition": "compact", "generation_mode": "text-to-image", "film_type": "instant", "format": "compact", "style_era": "modern"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "modern_compact", "optimized_for": "contemporary instant", "preset_type": "instant_film", "mood": "Modern", "tags": ["polaroid", "go", "modern", "compact", "crisp", "contemporary"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Vintage Instant Film
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Vintage Instant Film',
  'Aged, faded instant film with nostalgic character, light leaks, and authentic vintage imperfections.',
  'style',
  'Vintage instant film photograph of {subject}, aged faded appearance, light leaks, nostalgic character, vintage imperfections, authentic old instant film aesthetic, worn instant camera style',
  'clean, sharp, modern, perfect, digital, high quality, pristine',
  '{"style": "vintage_instant", "lighting": "natural", "background": "aged", "composition": "imperfect", "generation_mode": "text-to-image", "film_type": "instant", "condition": "aged", "imperfections": "authentic"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "aged_vintage", "optimized_for": "nostalgic character", "preset_type": "instant_film", "mood": "Nostalgic", "tags": ["vintage", "aged", "faded", "light leaks", "nostalgic", "imperfect"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Black & White Instant
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Black & White Instant Film',
  'Classic black and white instant film with high contrast, dramatic tones, and timeless monochrome aesthetic.',
  'style',
  'Black and white instant film photograph of {subject}, high contrast monochrome, dramatic black and white tones, classic instant film aesthetic, timeless monochrome instant photography',
  'color, colorful, muted, low contrast, faded, sepia, tinted',
  '{"style": "bw_instant", "lighting": "contrast", "background": "monochrome", "composition": "dramatic", "generation_mode": "text-to-image", "film_type": "instant", "color": "monochrome", "contrast": "high"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "monochrome_instant", "optimized_for": "dramatic b&w", "preset_type": "instant_film", "mood": "Dramatic", "tags": ["black", "white", "monochrome", "contrast", "dramatic", "timeless"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Sepia Instant Film
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Sepia Instant Film',
  'Warm sepia-toned instant film with vintage brownish tint and nostalgic atmosphere.',
  'style',
  'Sepia-toned instant film photograph of {subject}, warm brownish tint, vintage sepia aesthetic, nostalgic atmosphere, classic instant film with sepia tones, vintage instant camera style',
  'colorful, black and white, bright, modern, digital, cool tones',
  '{"style": "sepia_instant", "lighting": "warm", "background": "sepia", "composition": "vintage", "generation_mode": "text-to-image", "film_type": "instant", "color_tone": "sepia", "atmosphere": "nostalgic"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "sepia_instant", "optimized_for": "warm vintage tones", "preset_type": "instant_film", "mood": "Warm", "tags": ["sepia", "vintage", "warm", "brown", "nostalgic", "toned"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Double Exposure Instant
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Double Exposure Instant Film',
  'Creative double exposure instant film with overlapping images, artistic composition, and surreal aesthetic.',
  'style',
  'Double exposure instant film photograph of {subject}, overlapping images, artistic composition, surreal instant film aesthetic, creative double exposure technique, artistic instant photography',
  'single exposure, simple, clear, straightforward, normal, standard',
  '{"style": "double_exposure_instant", "lighting": "artistic", "background": "layered", "composition": "surreal", "generation_mode": "text-to-image", "film_type": "instant", "technique": "double_exposure", "style": "artistic"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "artistic_instant", "optimized_for": "creative expression", "preset_type": "instant_film", "mood": "Surreal", "tags": ["double", "exposure", "artistic", "surreal", "creative", "layered"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Overexposed Instant Film
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Overexposed Instant Film',
  'Artistic overexposed instant film with bright, washed-out colors and dreamy, ethereal quality.',
  'style',
  'Overexposed instant film photograph of {subject}, bright washed-out colors, dreamy ethereal quality, artistic overexposure, dreamy instant film aesthetic, bright instant photography style',
  'dark, underexposed, normal exposure, sharp, clear, well-exposed',
  '{"style": "overexposed_instant", "lighting": "bright", "background": "washed", "composition": "ethereal", "generation_mode": "text-to-image", "film_type": "instant", "exposure": "overexposed", "quality": "dreamy"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "artistic_overexposure", "optimized_for": "ethereal aesthetic", "preset_type": "instant_film", "mood": "Ethereal", "tags": ["overexposed", "bright", "dreamy", "ethereal", "washed", "artistic"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Underexposed Instant Film
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Underexposed Instant Film',
  'Moody underexposed instant film with dark, atmospheric tones and mysterious aesthetic.',
  'style',
  'Underexposed instant film photograph of {subject}, dark atmospheric tones, mysterious aesthetic, moody instant film style, dark instant photography, atmospheric instant film',
  'bright, overexposed, well-lit, clear, normal exposure, light',
  '{"style": "underexposed_instant", "lighting": "dark", "background": "atmospheric", "composition": "moody", "generation_mode": "text-to-image", "film_type": "instant", "exposure": "underexposed", "mood": "dark"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "moody_instant", "optimized_for": "atmospheric mood", "preset_type": "instant_film", "mood": "Moody", "tags": ["underexposed", "dark", "moody", "atmospheric", "mysterious", "shadowy"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Polaroid Rainbow Border
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Polaroid Rainbow Border',
  'Playful instant film with colorful rainbow borders, fun aesthetic, and vibrant instant photography style.',
  'style',
  'Polaroid instant photograph of {subject}, colorful rainbow border, playful fun aesthetic, vibrant instant photography style, colorful instant film aesthetic, fun instant camera style',
  'white border, monochrome, serious, dark, muted colors, plain',
  '{"style": "rainbow_border", "lighting": "vibrant", "background": "colorful", "composition": "playful", "generation_mode": "text-to-image", "film_type": "instant", "border": "rainbow", "mood": "playful"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "playful_instant", "optimized_for": "fun colorful photography", "preset_type": "instant_film", "mood": "Playful", "tags": ["rainbow", "colorful", "playful", "fun", "vibrant", "border"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Instant Film Portrait
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Instant Film Portrait',
  'Specialized instant film preset optimized for portraits with flattering lighting and authentic instant film character.',
  'style',
  'Instant film portrait of {subject}, flattering lighting, authentic instant film character, portrait instant photography, warm instant film tones, natural instant camera portrait style',
  'studio lighting, professional, sharp, digital, cold tones, artificial',
  '{"style": "instant_portrait", "lighting": "flattering", "background": "natural", "composition": "portrait", "generation_mode": "text-to-image", "film_type": "instant", "specialization": "portrait", "tones": "warm"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "portrait_instant", "optimized_for": "authentic portraits", "preset_type": "instant_film", "mood": "Natural", "tags": ["portrait", "instant", "natural", "warm", "flattering", "authentic"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Instant Film Landscape
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Instant Film Landscape',
  'Wide format instant film preset perfect for landscapes with natural colors and scenic compositions.',
  'style',
  'Instant film landscape of {subject}, natural scenic colors, wide format instant film aesthetic, landscape instant photography, natural instant camera landscape style, scenic instant film',
  'portrait orientation, close-up, macro, studio, artificial lighting, urban',
  '{"style": "instant_landscape", "lighting": "natural", "background": "scenic", "composition": "landscape", "generation_mode": "text-to-image", "film_type": "instant", "specialization": "landscape", "format": "wide"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "4:3"}',
  '{"specialization": "instant_film", "use_case": "landscape_instant", "optimized_for": "natural landscapes", "preset_type": "instant_film", "mood": "Natural", "tags": ["landscape", "instant", "natural", "scenic", "wide", "outdoor"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
);

-- Add comments for documentation
COMMENT ON TABLE presets IS 'Instant film presets added for authentic instant photography aesthetic';

-- Create indexes for instant film presets
CREATE INDEX IF NOT EXISTS idx_presets_instant_film_type 
ON presets ((ai_metadata->>'preset_type')) 
WHERE ai_metadata->>'preset_type' = 'instant_film';

CREATE INDEX IF NOT EXISTS idx_presets_instant_film_style 
ON presets ((style_settings->>'film_type')) 
WHERE style_settings->>'film_type' = 'instant';

-- Add validation for instant film styles
CREATE OR REPLACE FUNCTION validate_instant_film_style(style_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN style_name IN (
    'polaroid_originals', 'polaroid_600', 'instax_mini', 'instax_wide',
    'sx70', 'spectra', 'polaroid_go', 'vintage_instant',
    'bw_instant', 'sepia_instant', 'double_exposure_instant',
    'overexposed_instant', 'underexposed_instant', 'rainbow_border',
    'instant_portrait', 'instant_landscape'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_instant_film_style(TEXT) IS 'Validates instant film style names';
