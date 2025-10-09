-- Create comprehensive style prompts table with all 58 styles
-- Run this in Supabase SQL Editor

-- Insert all base styles (49) + video styles (9) = 58 total
INSERT INTO public.style_prompts (style_name, display_name, category, text_to_image_prompt, image_to_image_prompt, description, is_active, sort_order)
VALUES
-- Original Styles (8)
('photorealistic', 'Photorealistic', 'original', 'Create a photorealistic image with natural lighting and detailed textures', 'Apply photorealistic rendering with natural lighting and detailed textures', 'High-quality realistic photography style', true, 1),
('artistic', 'Artistic', 'original', 'Create an artistic painting with creative brushstrokes and vibrant colors', 'Apply an artistic painting style with creative brushstrokes and vibrant colors', 'Creative artistic painting style', true, 2),
('cartoon', 'Cartoon', 'original', 'Create a cartoon-style illustration with bold outlines and bright colors', 'Transform into a cartoon-style illustration with bold outlines and bright colors', 'Bold cartoon illustration style', true, 3),
('vintage', 'Vintage', 'original', 'Create a vintage aesthetic with retro colors and nostalgic atmosphere', 'Apply a vintage aesthetic with retro colors and nostalgic atmosphere', 'Retro vintage photography style', true, 4),
('cyberpunk', 'Cyberpunk', 'original', 'Create a cyberpunk style with neon lights and futuristic elements', 'Apply cyberpunk style with neon lights and futuristic elements', 'Futuristic cyberpunk aesthetic', true, 5),
('watercolor', 'Watercolor', 'original', 'Create a watercolor painting with soft, flowing colors and translucent effects', 'Apply watercolor painting technique with soft, flowing colors and translucent effects', 'Soft watercolor painting style', true, 6),
('sketch', 'Sketch', 'original', 'Create a pencil sketch with detailed line work and shading', 'Convert to a pencil sketch style with detailed line work and shading', 'Detailed pencil sketch style', true, 7),
('oil_painting', 'Oil Painting', 'original', 'Create an oil painting with rich textures and classical art style', 'Apply oil painting technique with rich textures and classical art style', 'Classical oil painting style', true, 8),

-- Photography Styles (9)
('portrait', 'Portrait', 'photography', 'Create a professional portrait with soft lighting and detailed facial features', 'Transform into a professional portrait with soft lighting and detailed facial features', 'Professional portrait photography', true, 10),
('fashion', 'Fashion', 'photography', 'Create a fashion photography style with dramatic lighting and elegant composition', 'Apply fashion photography style with dramatic lighting and elegant composition', 'High-end fashion photography', true, 11),
('editorial', 'Editorial', 'photography', 'Create an editorial photography style with sophisticated lighting and storytelling composition', 'Apply editorial photography style with sophisticated lighting and storytelling composition', 'Magazine editorial photography', true, 12),
('commercial', 'Commercial', 'photography', 'Create a commercial photography style with clean lighting and professional presentation', 'Apply commercial photography style with clean lighting and professional presentation', 'Professional commercial photography', true, 13),
('lifestyle', 'Lifestyle', 'photography', 'Create a lifestyle photography style with natural lighting and authentic moments', 'Apply lifestyle photography style with natural lighting and authentic moments', 'Authentic lifestyle photography', true, 14),
('street', 'Street', 'photography', 'Create a street photography style with candid moments and urban atmosphere', 'Apply street photography style with candid moments and urban atmosphere', 'Urban street photography', true, 15),
('architecture', 'Architecture', 'photography', 'Create an architectural photography style with clean lines and dramatic perspectives', 'Apply architectural photography style with clean lines and dramatic perspectives', 'Architectural photography', true, 16),
('nature', 'Nature', 'photography', 'Create a nature photography style with natural lighting and organic textures', 'Apply nature photography style with natural lighting and organic textures', 'Natural outdoor photography', true, 17),

-- Artistic Styles (9)
('abstract', 'Abstract', 'artistic', 'Create an abstract artwork with bold shapes, colors, and non-representational forms', 'Transform into an abstract artwork with bold shapes, colors, and non-representational forms', 'Non-representational abstract art', true, 20),
('surreal', 'Surreal', 'artistic', 'Create a surreal artwork with dreamlike imagery and impossible combinations', 'Transform into a surreal artwork with dreamlike imagery and impossible combinations', 'Dreamlike surreal art', true, 21),
('minimalist', 'Minimalist', 'artistic', 'Create a minimalist artwork with clean lines, simple forms, and negative space', 'Apply minimalist style with clean lines, simple forms, and negative space', 'Clean minimalist design', true, 22),
('maximalist', 'Maximalist', 'artistic', 'Create a maximalist artwork with rich details, vibrant colors, and complex compositions', 'Apply maximalist style with rich details, vibrant colors, and complex compositions', 'Rich detailed maximalist art', true, 23),
('impressionist', 'Impressionist', 'artistic', 'Create an impressionist painting with loose brushstrokes and light effects', 'Apply impressionist painting technique with loose brushstrokes and light effects', 'Classical impressionist painting', true, 24),
('renaissance', 'Renaissance', 'artistic', 'Create a Renaissance-style artwork with classical composition and detailed realism', 'Apply Renaissance painting technique with classical composition and detailed realism', 'Classical Renaissance art', true, 25),
('baroque', 'Baroque', 'artistic', 'Create a Baroque-style artwork with dramatic lighting and ornate details', 'Apply Baroque painting technique with dramatic lighting and ornate details', 'Dramatic Baroque art', true, 26),
('art_deco', 'Art Deco', 'artistic', 'Create an Art Deco style with geometric patterns and elegant symmetry', 'Apply Art Deco style with geometric patterns and elegant symmetry', 'Elegant Art Deco design', true, 27),

-- Creative Styles (8)
('pop_art', 'Pop Art', 'creative', 'Create a Pop Art style with bold colors, commercial imagery, and graphic elements', 'Transform into Pop Art style with bold colors, commercial imagery, and graphic elements', 'Bold Pop Art aesthetic', true, 30),
('graffiti', 'Graffiti', 'creative', 'Create a graffiti art style with bold lettering, vibrant colors, and urban edge', 'Apply graffiti art style with bold lettering, vibrant colors, and urban edge', 'Urban graffiti art', true, 31),
('digital_art', 'Digital Art', 'creative', 'Create a digital art style with clean vectors, vibrant colors, and modern aesthetics', 'Apply digital art style with clean vectors, vibrant colors, and modern aesthetics', 'Modern digital art', true, 32),
('concept_art', 'Concept Art', 'creative', 'Create a concept art style with detailed world-building and imaginative design', 'Apply concept art style with detailed world-building and imaginative design', 'Imaginative concept art', true, 33),
('fantasy', 'Fantasy', 'creative', 'Create a fantasy art style with magical elements and otherworldly atmosphere', 'Transform into fantasy art style with magical elements and otherworldly atmosphere', 'Magical fantasy art', true, 34),
('sci_fi', 'Sci-Fi', 'creative', 'Create a sci-fi art style with futuristic technology and space-age aesthetics', 'Apply sci-fi art style with futuristic technology and space-age aesthetics', 'Futuristic sci-fi art', true, 35),
('steampunk', 'Steampunk', 'creative', 'Create a steampunk style with Victorian-era machinery and brass aesthetics', 'Apply steampunk style with Victorian-era machinery and brass aesthetics', 'Victorian steampunk aesthetic', true, 36),
('gothic', 'Gothic', 'creative', 'Create a gothic art style with dark atmosphere and ornate details', 'Apply gothic art style with dark atmosphere and ornate details', 'Dark gothic aesthetic', true, 37),

-- Cinematic Styles (8)
('cinematic', 'Cinematic', 'cinematic', 'Create a cinematic image with dramatic lighting and movie-quality composition', 'Apply cinematic style with dramatic lighting and movie-quality composition', 'Movie-quality cinematic style', true, 40),
('film_noir', 'Film Noir', 'cinematic', 'Create a film noir style with high contrast lighting and dramatic shadows', 'Apply film noir style with high contrast lighting and dramatic shadows', 'Classic film noir aesthetic', true, 41),
('dramatic', 'Dramatic', 'cinematic', 'Create a dramatic image with intense lighting and emotional composition', 'Apply dramatic style with intense lighting and emotional composition', 'Emotionally intense dramatic style', true, 42),
('moody', 'Moody', 'cinematic', 'Create a moody image with atmospheric lighting and emotional depth', 'Apply moody style with atmospheric lighting and emotional depth', 'Atmospheric moody style', true, 43),
('bright', 'Bright', 'cinematic', 'Create a bright, cheerful image with high-key lighting and vibrant colors', 'Apply bright, cheerful style with high-key lighting and vibrant colors', 'Cheerful bright lighting', true, 44),
('monochrome', 'Monochrome', 'cinematic', 'Create a monochrome image with high contrast and tonal range', 'Convert to monochrome style with high contrast and tonal range', 'High contrast monochrome', true, 45),
('sepia', 'Sepia', 'cinematic', 'Create a sepia-toned image with warm, vintage atmosphere', 'Apply sepia tone with warm, vintage atmosphere', 'Warm vintage sepia tone', true, 46),
('hdr', 'HDR', 'cinematic', 'Create an HDR image with enhanced dynamic range and vivid details', 'Apply HDR processing with enhanced dynamic range and vivid details', 'Enhanced dynamic range processing', true, 47),

-- Video Motion Styles (7) - Already exist, updating if needed
('smooth', 'Smooth Motion', 'creative', 'Create video with smooth motion, fluid camera movements, seamless transitions, stable footage, and gradual changes', 'Apply smooth motion with fluid camera movements, seamless transitions, stable footage, gradual changes, and professional stabilization', 'Smooth, fluid camera movements and transitions', true, 104),
('fast-paced', 'Fast-Paced', 'creative', 'Create fast-paced video with quick movements, rapid transitions, energetic action, and dynamic atmosphere', 'Apply fast-paced motion with quick movements, rapid cuts, energetic transitions, dynamic action, and high-energy atmosphere', 'Quick, energetic movements and rapid transitions', true, 105),
('slow-motion', 'Slow Motion', 'creative', 'Create slow motion video with deliberate movements, emphasized details, and contemplative pacing', 'Apply slow motion effect with deliberate movements, emphasized details, smooth slow-motion transitions, and contemplative pacing', 'Slow, deliberate movements emphasizing details', true, 106),
('time-lapse', 'Time-Lapse', 'creative', 'Create time-lapse video showing accelerated time passage, rapid changes, and continuous motion', 'Apply time-lapse effect showing accelerated time passage, rapid changes, continuous motion, and temporal progression', 'Accelerated time passage showing change over time', true, 107),

-- Video Style Effects (5) - New additions
('anime', 'Anime Style', 'artistic', 'Create anime style video with vibrant colors, expressive characters, dynamic camera movements, smooth motion, cel-shaded rendering, and Japanese animation aesthetics', 'Transform into anime style animation with vibrant colors, expressive characters, dynamic camera movements, smooth motion, cel-shaded rendering, and Japanese animation aesthetics', 'Japanese anime/manga art style with vibrant colors and expressive characters', true, 100),
('dreamy', 'Dreamy', 'artistic', 'Create dreamy video with soft focus, pastel tones, ethereal atmosphere, gentle movements, light diffusion, and whimsical mood', 'Transform into dreamy style with soft focus, pastel tones, ethereal atmosphere, gentle movements, light diffusion, and whimsical mood', 'Soft, ethereal dreamlike quality with hazy atmosphere', true, 102),
('glitch', 'Glitch Effect', 'creative', 'Create glitch style video with digital distortion, chromatic aberration, and cyberpunk atmosphere', 'Apply glitch effects with digital distortion, chromatic aberration, scan lines, data corruption aesthetics, and cyberpunk atmosphere', 'Digital glitch and distortion effects', true, 109)

ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- Count the results
SELECT
  COUNT(*) as total_styles,
  COUNT(*) FILTER (WHERE is_active = true) as active_styles,
  COUNT(*) FILTER (WHERE category = 'original') as original_styles,
  COUNT(*) FILTER (WHERE category = 'photography') as photography_styles,
  COUNT(*) FILTER (WHERE category = 'artistic') as artistic_styles,
  COUNT(*) FILTER (WHERE category = 'creative') as creative_styles,
  COUNT(*) FILTER (WHERE category = 'cinematic') as cinematic_styles
FROM public.style_prompts;
