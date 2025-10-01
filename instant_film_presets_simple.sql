-- Quick Instant Film Presets - Ready to Run
-- Simplified version for immediate database insertion

-- Polaroid Originals Classic
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured) VALUES
(
  'Polaroid Originals Classic',
  'Classic Polaroid instant film with iconic white border, warm tones, and vintage charm',
  'style',
  'Instant film photograph of {subject}, Polaroid Originals style, white border frame, warm color palette, vintage instant camera aesthetic, nostalgic mood, authentic film grain',
  'digital, high resolution, sharp focus, modern camera, professional lighting, studio quality',
  '{"style": "polaroid_originals", "lighting": "natural", "background": "vintage", "composition": "instant", "film_type": "instant", "border": "white", "color_tone": "warm"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "nostalgic_photography", "mood": "Nostalgic", "tags": ["polaroid", "instant", "vintage", "warm", "nostalgic"]}',
  true,
  true
),

-- Fujifilm Instax Mini
(
  'Fujifilm Instax Mini',
  'Clean, bright Fujifilm Instax Mini instant film with crisp white borders and vibrant colors',
  'style',
  'Fujifilm Instax Mini instant photograph of {subject}, clean white border, bright vibrant colors, crisp instant film aesthetic, modern instant camera style',
  'vintage, faded, low contrast, dark, film grain, aged, nostalgic',
  '{"style": "instax_mini", "lighting": "bright", "background": "clean", "composition": "crisp", "film_type": "instant", "border": "white", "color_accuracy": "high"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "modern_instant", "mood": "Bright", "tags": ["instax", "mini", "instant", "clean", "bright", "modern"]}',
  true,
  true
),

-- Polaroid 600 Series
(
  'Polaroid 600 Series',
  'Classic Polaroid 600 instant film with distinctive white borders and saturated colors',
  'style',
  'Polaroid 600 instant photograph of {subject}, classic white border, saturated colors, authentic film texture, instant camera aesthetic, vintage charm',
  'digital, modern, high resolution, sharp, professional, studio, clean',
  '{"style": "polaroid_600", "lighting": "natural", "background": "vintage", "composition": "instant", "film_type": "instant", "border": "white", "color_saturation": "high"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "classic_instant", "mood": "Classic", "tags": ["polaroid", "600", "instant", "vintage", "saturated", "classic"]}',
  true,
  true
),

-- Black & White Instant
(
  'Black & White Instant Film',
  'Classic black and white instant film with high contrast and dramatic tones',
  'style',
  'Black and white instant film photograph of {subject}, high contrast monochrome, dramatic black and white tones, classic instant film aesthetic, timeless monochrome instant photography',
  'color, colorful, muted, low contrast, faded, sepia, tinted',
  '{"style": "bw_instant", "lighting": "contrast", "background": "monochrome", "composition": "dramatic", "film_type": "instant", "color": "monochrome", "contrast": "high"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "monochrome_instant", "mood": "Dramatic", "tags": ["black", "white", "monochrome", "contrast", "dramatic", "timeless"]}',
  true,
  true
),

-- Vintage Instant Film
(
  'Vintage Instant Film',
  'Aged, faded instant film with nostalgic character and authentic vintage imperfections',
  'style',
  'Vintage instant film photograph of {subject}, aged faded appearance, light leaks, nostalgic character, vintage imperfections, authentic old instant film aesthetic',
  'clean, sharp, modern, perfect, digital, high quality, pristine',
  '{"style": "vintage_instant", "lighting": "natural", "background": "aged", "composition": "imperfect", "film_type": "instant", "condition": "aged", "imperfections": "authentic"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "aged_vintage", "mood": "Nostalgic", "tags": ["vintage", "aged", "faded", "light leaks", "nostalgic", "imperfect"]}',
  true,
  false
),

-- Fujifilm Instax Wide
(
  'Fujifilm Instax Wide',
  'Wide format Fujifilm Instax with larger frame and vibrant colors',
  'style',
  'Fujifilm Instax Wide instant photograph of {subject}, wide format white border, vibrant colors, large instant film aesthetic, wide instant camera style',
  'narrow format, small, faded, low quality, dark, vintage grain',
  '{"style": "instax_wide", "lighting": "natural", "background": "wide", "composition": "landscape", "film_type": "instant", "border": "white", "format": "wide"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "4:3"}',
  '{"specialization": "instant_film", "use_case": "wide_format_instant", "mood": "Vibrant", "tags": ["instax", "wide", "instant", "landscape", "vibrant", "format"]}',
  true,
  true
),

-- Polaroid SX-70
(
  'Polaroid SX-70 Vintage',
  'Classic SX-70 instant film with soft colors and vintage aesthetic',
  'style',
  'Polaroid SX-70 instant photograph of {subject}, vintage square format, soft muted colors, classic instant film aesthetic, retro instant camera style',
  'bright, saturated, modern, digital, sharp, high contrast, clean',
  '{"style": "sx70", "lighting": "soft", "background": "vintage", "composition": "square", "film_type": "instant", "format": "square", "color_tone": "muted"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "vintage_instant", "mood": "Vintage", "tags": ["sx70", "polaroid", "vintage", "square", "muted", "retro"]}',
  true,
  false
),

-- Instant Film Portrait
(
  'Instant Film Portrait',
  'Specialized instant film preset optimized for portraits with flattering lighting',
  'style',
  'Instant film portrait of {subject}, flattering lighting, authentic instant film character, portrait instant photography, warm instant film tones, natural instant camera portrait style',
  'studio lighting, professional, sharp, digital, cold tones, artificial',
  '{"style": "instant_portrait", "lighting": "flattering", "background": "natural", "composition": "portrait", "film_type": "instant", "specialization": "portrait", "tones": "warm"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "portrait_instant", "mood": "Natural", "tags": ["portrait", "instant", "natural", "warm", "flattering", "authentic"]}',
  true,
  true
),

-- Sepia Instant Film
(
  'Sepia Instant Film',
  'Warm sepia-toned instant film with vintage brownish tint and nostalgic atmosphere',
  'style',
  'Sepia-toned instant film photograph of {subject}, warm brownish tint, vintage sepia aesthetic, nostalgic atmosphere, classic instant film with sepia tones',
  'colorful, black and white, bright, modern, digital, cool tones',
  '{"style": "sepia_instant", "lighting": "warm", "background": "sepia", "composition": "vintage", "film_type": "instant", "color_tone": "sepia", "atmosphere": "nostalgic"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "sepia_instant", "mood": "Warm", "tags": ["sepia", "vintage", "warm", "brown", "nostalgic", "toned"]}',
  true,
  false
),

-- Polaroid Go Modern
(
  'Polaroid Go Modern',
  'Modern Polaroid Go instant film with compact format and crisp colors',
  'style',
  'Polaroid Go instant photograph of {subject}, compact modern format, crisp clean colors, contemporary instant camera aesthetic, modern instant photography style',
  'vintage, faded, large format, grainy, aged, retro, soft',
  '{"style": "polaroid_go", "lighting": "natural", "background": "modern", "composition": "compact", "film_type": "instant", "format": "compact", "style_era": "modern"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "instant_film", "use_case": "modern_compact", "mood": "Modern", "tags": ["polaroid", "go", "modern", "compact", "crisp", "contemporary"]}',
  true,
  true
);
