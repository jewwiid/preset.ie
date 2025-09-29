-- Create sample presets for headshots, product photos, and trending presets
-- This will populate the empty presets table with sample data
-- Fixed to match actual workflow: generation_mode uses 'image'/'video'/'both', categories use 'style'/'cinematic'/'technical'/'custom'

-- Insert Headshot Presets
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
  likes_count,
  created_at,
  updated_at
) VALUES 
-- Professional Headshot
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Professional Corporate Headshot',
  'Clean, professional headshot perfect for LinkedIn, business cards, and corporate profiles. Features professional lighting and neutral background.',
  'style',
  'Professional headshot of a {subject}, corporate style, clean lighting, neutral background, business attire, confident expression, high quality, professional photography',
  'casual, informal, low quality, blurry, dark, unprofessional, party, social media selfie',
  '{"style": "professional", "lighting": "studio", "background": "neutral", "expression": "confident", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "corporate_portrait", "use_case": "professional_networking", "optimized_for": "business profiles", "preset_type": "headshot"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  45,
  12,
  NOW(),
  NOW()
),

-- LinkedIn Headshot
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'LinkedIn Professional Portrait',
  'Optimized for LinkedIn profiles with professional lighting and approachable expression.',
  'style',
  'LinkedIn profile photo of a {subject}, professional headshot, friendly smile, business casual attire, clean background, professional lighting, approachable yet confident',
  'formal suit, overly serious, dark lighting, unprofessional, casual wear',
  '{"style": "professional", "lighting": "natural", "background": "clean", "expression": "friendly", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "linkedin_photo", "use_case": "professional_networking", "optimized_for": "LinkedIn profiles", "preset_type": "headshot"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  38,
  8,
  NOW(),
  NOW()
),

-- Creative Headshot
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Creative Professional Portrait',
  'Modern, creative take on professional headshots with artistic lighting and composition.',
  'style',
  'Creative professional portrait of a {subject}, artistic lighting, modern composition, business attire, confident pose, high-end photography, cinematic style',
  'casual, low quality, traditional, boring, outdated, unprofessional',
  '{"style": "creative", "lighting": "artistic", "background": "modern", "expression": "confident", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "creative_portrait", "use_case": "professional_portfolio", "optimized_for": "creative professionals", "preset_type": "headshot"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  23,
  5,
  NOW(),
  NOW()
),

-- E-commerce Product Photo
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'E-commerce Product Photography',
  'Clean, professional product photos perfect for online stores and catalogs.',
  'style',
  'Professional product photography of {product}, clean white background, studio lighting, high resolution, commercial quality, e-commerce style',
  'busy background, poor lighting, low quality, amateur, cluttered, shadows',
  '{"style": "commercial", "lighting": "studio", "background": "white", "composition": "clean", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "ecommerce", "use_case": "product_catalog", "optimized_for": "online stores", "preset_type": "product"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  67,
  15,
  NOW(),
  NOW()
),

-- Lifestyle Product Photo
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Lifestyle Product Photography',
  'Products in natural, lifestyle settings that tell a story and connect with customers.',
  'style',
  'Lifestyle product photography of {product}, natural setting, warm lighting, authentic environment, lifestyle context, commercial quality',
  'studio background, artificial, cold lighting, isolated product, clinical',
  '{"style": "lifestyle", "lighting": "natural", "background": "environmental", "composition": "contextual", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "product_lifestyle", "use_case": "marketing", "optimized_for": "brand storytelling", "preset_type": "product"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  52,
  11,
  NOW(),
  NOW()
),

-- Studio Product Shot
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Studio Product Photography',
  'Professional studio shots with controlled lighting and premium presentation.',
  'style',
  'Studio product photography of {product}, professional lighting setup, premium presentation, commercial quality, detailed product focus',
  'natural lighting, lifestyle, environmental, casual, low quality',
  '{"style": "studio", "lighting": "controlled", "background": "professional", "composition": "focused", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "product_studio", "use_case": "product_catalog", "optimized_for": "premium products", "preset_type": "product"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  31,
  7,
  NOW(),
  NOW()
),

-- Cinematic Portrait
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Cinematic Portrait Style',
  'Dramatic, cinematic portrait with artistic lighting and composition.',
  'cinematic',
  'Cinematic portrait of {subject}, dramatic lighting, artistic composition, film photography style, high contrast, professional quality',
  'casual, low contrast, flat lighting, amateur, bright, cheerful',
  '{"style": "cinematic", "lighting": "dramatic", "background": "artistic", "composition": "dynamic", "generation_mode": "text-to-image", "enableCinematicMode": true, "cinematicParameters": {"cameraAngle": "low-angle", "lensType": "telephoto", "lightingStyle": "dramatic", "sceneMood": "mysterious", "directorStyle": "christopher-nolan"}}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "cinematic_portrait", "use_case": "artistic_portfolio", "cinematic_settings": {"mood": "dramatic"}, "preset_type": "cinematic"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'both',
  true,
  true,
  89,
  18,
  NOW(),
  NOW()
),

-- Photorealistic Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Photorealistic Style',
  'Ultra-realistic images that look like professional photography.',
  'style',
  'Create a photorealistic image of {subject}, natural lighting, detailed textures, high resolution, professional photography quality',
  'cartoon, anime, artistic, stylized, low quality, blurry',
  '{"style": "photorealistic", "lighting": "natural", "background": "realistic", "composition": "natural", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "photorealistic", "use_case": "realistic_generation", "optimized_for": "professional photography", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  156,
  28,
  NOW(),
  NOW()
),

-- Artistic Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Artistic Style',
  'Creative, artistic interpretation with painterly effects.',
  'style',
  'Create an artistic painting of {subject}, painterly style, creative interpretation, artistic composition, expressive brushstrokes',
  'photorealistic, realistic, technical, mechanical, low quality',
  '{"style": "artistic", "lighting": "artistic", "background": "creative", "composition": "artistic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "artistic", "use_case": "creative_generation", "optimized_for": "artistic expression", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  143,
  25,
  NOW(),
  NOW()
),

-- Cartoon Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Cartoon Style',
  'Fun, colorful cartoon illustrations with clean lines.',
  'style',
  'Create a cartoon-style illustration of {subject}, clean lines, bright colors, fun and playful, animated style',
  'realistic, photorealistic, dark, serious, low quality',
  '{"style": "cartoon", "lighting": "bright", "background": "colorful", "composition": "playful", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "cartoon", "use_case": "illustration", "optimized_for": "children and entertainment", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  128,
  22,
  NOW(),
  NOW()
),

-- Vintage Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Vintage Style',
  'Classic, nostalgic aesthetic with retro color grading.',
  'style',
  'Create a vintage aesthetic of {subject}, retro styling, nostalgic colors, classic composition, aged film look',
  'modern, contemporary, bright colors, digital, low quality',
  '{"style": "vintage", "lighting": "warm", "background": "retro", "composition": "classic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "vintage", "use_case": "retro_generation", "optimized_for": "nostalgic content", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  112,
  19,
  NOW(),
  NOW()
),

-- Cyberpunk Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Cyberpunk Style',
  'Futuristic, neon-lit aesthetic with high-tech elements.',
  'style',
  'Create a cyberpunk style image of {subject}, neon lighting, futuristic elements, high-tech aesthetic, dark atmosphere',
  'natural, organic, bright daylight, low-tech, low quality',
  '{"style": "cyberpunk", "lighting": "neon", "background": "futuristic", "composition": "dynamic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "cyberpunk", "use_case": "sci_fi_generation", "optimized_for": "futuristic content", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  134,
  24,
  NOW(),
  NOW()
),

-- Watercolor Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Watercolor Style',
  'Soft, flowing watercolor painting technique.',
  'style',
  'Create a watercolor painting of {subject}, soft flowing colors, organic brushstrokes, artistic technique, gentle blending',
  'sharp lines, digital, hard edges, mechanical, low quality',
  '{"style": "watercolor", "lighting": "soft", "background": "flowing", "composition": "organic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "watercolor", "use_case": "artistic_generation", "optimized_for": "fine art", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  98,
  17,
  NOW(),
  NOW()
),

-- Anime Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Anime Style',
  'Japanese animation style with expressive features.',
  'style',
  'Create an anime style illustration of {subject}, Japanese animation style, expressive features, clean lines, vibrant colors',
  'realistic, western cartoon, dark, gritty, low quality',
  '{"style": "anime", "lighting": "bright", "background": "anime", "composition": "expressive", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "anime", "use_case": "animation_generation", "optimized_for": "anime fans", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  167,
  31,
  NOW(),
  NOW()
),

-- Fantasy Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Fantasy Style',
  'Magical, mystical fantasy art with enchanting elements.',
  'style',
  'Create a fantasy art style image of {subject}, magical elements, mystical atmosphere, enchanting composition, fantasy world',
  'realistic, modern, mundane, everyday, low quality',
  '{"style": "fantasy", "lighting": "magical", "background": "mystical", "composition": "enchanting", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "fantasy", "use_case": "fantasy_generation", "optimized_for": "fantasy content", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  145,
  26,
  NOW(),
  NOW()
),

-- Graffiti Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Graffiti Art Style',
  'Urban street art with bold colors and dynamic composition.',
  'style',
  'Create a graffiti art style of {subject}, urban street art, bold colors, dynamic composition, spray paint effects',
  'clean, minimal, subtle, corporate, low quality',
  '{"style": "graffiti", "lighting": "bold", "background": "urban", "composition": "dynamic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "graffiti", "use_case": "street_art_generation", "optimized_for": "urban art", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  87,
  15,
  NOW(),
  NOW()
),

-- Sci-Fi Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Sci-Fi Style',
  'Futuristic science fiction aesthetic with advanced technology.',
  'style',
  'Create a sci-fi art style of {subject}, futuristic technology, advanced materials, space-age aesthetic, high-tech design',
  'historical, medieval, primitive, low-tech, low quality',
  '{"style": "sci_fi", "lighting": "futuristic", "background": "space", "composition": "advanced", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "sci_fi", "use_case": "sci_fi_generation", "optimized_for": "science fiction", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  123,
  21,
  NOW(),
  NOW()
),

-- Renaissance Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Renaissance Style',
  'Classical Renaissance art with perfect proportions and perspective.',
  'style',
  'Create a Renaissance-style artwork of {subject}, classical composition, perfect proportions, perspective, chiaroscuro lighting, Italian Renaissance art',
  'modern, abstract, impressionist, low quality, amateur',
  '{"style": "renaissance", "lighting": "chiaroscuro", "background": "classical", "composition": "proportional", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "renaissance", "use_case": "classical_art", "optimized_for": "classical art lovers", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  178,
  32,
  NOW(),
  NOW()
),

-- Baroque Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Baroque Style',
  'Dramatic Baroque art with intense emotion and dynamic movement.',
  'style',
  'Create a Baroque-style artwork of {subject}, dramatic composition, intense emotion, dynamic movement, ornate details, dramatic lighting',
  'minimalist, simple, static, low quality, amateur',
  '{"style": "baroque", "lighting": "dramatic", "background": "ornate", "composition": "dynamic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "baroque", "use_case": "dramatic_art", "optimized_for": "dramatic expression", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  134,
  24,
  NOW(),
  NOW()
),

-- Impressionist Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Impressionist Style',
  'Soft, atmospheric impressionist painting with visible brushstrokes.',
  'style',
  'Create an impressionist painting of {subject}, soft brushstrokes, atmospheric light, loose composition, natural colors, French impressionist style',
  'sharp details, photorealistic, dark, low quality, amateur',
  '{"style": "impressionist", "lighting": "atmospheric", "background": "natural", "composition": "loose", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced"}',
  '{"specialization": "impressionist", "use_case": "atmospheric_art", "optimized_for": "artistic expression", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  167,
  29,
  NOW(),
  NOW()
),

-- Art Deco Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Art Deco Style',
  'Elegant geometric patterns and luxurious 1920s aesthetic.',
  'style',
  'Create an Art Deco style artwork of {subject}, geometric patterns, luxurious design, 1920s aesthetic, elegant composition, metallic accents',
  'organic shapes, rustic, low quality, amateur, simple',
  '{"style": "art_deco", "lighting": "elegant", "background": "geometric", "composition": "symmetrical", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "art_deco", "use_case": "luxury_design", "optimized_for": "elegant aesthetics", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  145,
  26,
  NOW(),
  NOW()
),

-- Pop Art Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Pop Art Style',
  'Bold, colorful pop art with commercial imagery and vibrant colors.',
  'style',
  'Create a Pop Art style artwork of {subject}, bold colors, commercial imagery, vibrant composition, Andy Warhol style, graphic design',
  'subtle colors, realistic, low quality, amateur, muted',
  '{"style": "pop_art", "lighting": "bold", "background": "colorful", "composition": "graphic", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "pop_art", "use_case": "commercial_art", "optimized_for": "modern design", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  189,
  34,
  NOW(),
  NOW()
),

-- Digital Art Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Digital Art Style',
  'Modern digital artwork with clean lines and vibrant colors.',
  'style',
  'Create a digital art style of {subject}, clean digital lines, vibrant colors, modern aesthetic, digital painting technique, contemporary art',
  'traditional media, realistic, low quality, amateur, analog',
  '{"style": "digital_art", "lighting": "digital", "background": "modern", "composition": "clean", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "digital_art", "use_case": "modern_art", "optimized_for": "contemporary design", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  156,
  28,
  NOW(),
  NOW()
),

-- Concept Art Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Concept Art Style',
  'Professional concept art for games, films, and media production.',
  'style',
  'Create concept art of {subject}, professional game art style, detailed design, production-ready artwork, cinematic composition, concept design',
  'simple sketch, amateur, low quality, rough draft',
  '{"style": "concept_art", "lighting": "cinematic", "background": "detailed", "composition": "professional", "generation_mode": "text-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "concept_art", "use_case": "production_art", "optimized_for": "media production", "preset_type": "style"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  142,
  25,
  NOW(),
  NOW()
),

-- Additional Cinematic Presets
-- Wes Anderson Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Wes Anderson Cinematic Style',
  'Symmetrical framing, pastel colors, and meticulous composition in the style of Wes Anderson.',
  'cinematic',
  'Wes Anderson style {subject}, symmetrical composition, pastel color palette, meticulous framing, centered subject, vintage aesthetic, film photography quality',
  'asymmetrical, dark colors, chaotic composition, modern, digital',
  '{"style": "wes-anderson", "lighting": "natural", "background": "pastel", "composition": "symmetrical", "generation_mode": "text-to-image", "enableCinematicMode": true, "cinematicParameters": {"cameraAngle": "eye-level", "lensType": "wide-angle", "lightingStyle": "natural", "sceneMood": "nostalgic", "directorStyle": "wes-anderson", "aspectRatio": "16:9"}}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "cinematic_wes_anderson", "use_case": "artistic_portfolio", "cinematic_settings": {"mood": "nostalgic"}, "preset_type": "cinematic"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'both',
  true,
  true,
  94,
  19,
  NOW(),
  NOW()
),

-- Christopher Nolan Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Christopher Nolan Cinematic Style',
  'Dark, dramatic lighting with complex narratives and high contrast imagery.',
  'cinematic',
  'Christopher Nolan style {subject}, dark dramatic lighting, high contrast, complex composition, cinematic depth, film noir aesthetic, professional cinematography',
  'bright, cheerful, simple, low contrast, amateur, digital',
  '{"style": "christopher-nolan", "lighting": "dramatic", "background": "dark", "composition": "complex", "generation_mode": "text-to-image", "enableCinematicMode": true, "cinematicParameters": {"cameraAngle": "low-angle", "lensType": "telephoto", "lightingStyle": "dramatic", "sceneMood": "mysterious", "directorStyle": "christopher-nolan", "aspectRatio": "2.35:1"}}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "cinematic_nolan", "use_case": "artistic_portfolio", "cinematic_settings": {"mood": "dramatic"}, "preset_type": "cinematic"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'both',
  true,
  true,
  87,
  16,
  NOW(),
  NOW()
),

-- Roger Deakins Style
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Roger Deakins Cinematic Style',
  'Naturalistic lighting with epic landscapes and masterful use of shadows.',
  'cinematic',
  'Roger Deakins style {subject}, naturalistic lighting, epic landscapes, masterful shadows, cinematic composition, professional cinematography, film quality',
  'artificial lighting, flat shadows, amateur, digital, low quality',
  '{"style": "roger-deakins", "lighting": "naturalistic", "background": "landscape", "composition": "epic", "generation_mode": "text-to-image", "enableCinematicMode": true, "cinematicParameters": {"cameraAngle": "wide", "lensType": "wide-angle", "lightingStyle": "naturalistic", "sceneMood": "epic", "directorStyle": "roger-deakins", "aspectRatio": "2.35:1"}}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "cinematic_deakins", "use_case": "artistic_portfolio", "cinematic_settings": {"mood": "epic"}, "preset_type": "cinematic"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'both',
  true,
  false,
  72,
  14,
  NOW(),
  NOW()
),

-- Image-to-Image Preset Example
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- User ID
  'Professional Headshot Enhancement',
  'Enhance existing photos with professional headshot styling and lighting.',
  'style',
  'Transform this image into a professional headshot, clean lighting, neutral background, business attire, confident expression, high quality, professional photography',
  'casual, informal, low quality, blurry, dark, unprofessional',
  '{"style": "professional", "lighting": "studio", "background": "neutral", "expression": "confident", "generation_mode": "image-to-image"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high"}',
  '{"specialization": "headshot_enhancement", "use_case": "photo_enhancement", "optimized_for": "existing photos", "preset_type": "headshot"}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  56,
  12,
  NOW(),
  NOW()
)

ON CONFLICT (id) DO NOTHING;
