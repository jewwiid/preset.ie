-- Add video-specific style prompts for better style application
-- These prompts are optimized for video generation
-- Run this migration via Supabase SQL Editor

INSERT INTO public.style_prompts (style_name, display_name, category, image_to_image_prompt, text_to_image_prompt, description, is_active, sort_order)
VALUES
  -- Anime Style
  ('anime', 'Anime Style', 'artistic',
   'Transform into anime style animation with vibrant colors, expressive characters, dynamic camera movements, smooth motion, cel-shaded rendering, and Japanese animation aesthetics',
   'Create anime style video with vibrant colors, expressive characters, dynamic camera movements, smooth motion, cel-shaded rendering, and Japanese animation aesthetics',
   'Japanese anime/manga art style with vibrant colors and expressive characters',
   true, 100),

  -- Cinematic Style
  ('cinematic', 'Cinematic', 'cinematic',
   'Apply cinematic treatment with dramatic lighting, film grain, color grading, professional camera movements, depth of field, and cinematic composition',
   'Create cinematic video with dramatic lighting, film grain, color grading, professional camera movements, depth of field, and cinematic composition',
   'Hollywood-style cinematic look with dramatic lighting and camera work',
   true, 101),

  -- Dreamy Style
  ('dreamy', 'Dreamy', 'artistic',
   'Transform into dreamy style with soft focus, pastel tones, ethereal atmosphere, gentle movements, light diffusion, and whimsical mood',
   'Create dreamy video with soft focus, pastel tones, ethereal atmosphere, gentle movements, light diffusion, and whimsical mood',
   'Soft, ethereal dreamlike quality with hazy atmosphere',
   true, 102),

  -- Dramatic Style
  ('dramatic', 'Dramatic', 'cinematic',
   'Apply dramatic style with high contrast lighting, intense shadows, bold colors, dynamic movements, emotional atmosphere, and theatrical composition',
   'Create dramatic video with high contrast lighting, intense shadows, bold colors, dynamic movements, emotional atmosphere, and theatrical composition',
   'High contrast dramatic style with intense mood and lighting',
   true, 103),

  -- Fast-Paced
  ('fast-paced', 'Fast-Paced', 'creative',
   'Apply fast-paced motion with quick movements, rapid cuts, energetic transitions, dynamic action, and high-energy atmosphere',
   'Create fast-paced video with quick movements, rapid transitions, energetic action, and dynamic atmosphere',
   'Quick, energetic movements and rapid transitions',
   true, 105),

  -- Slow Motion
  ('slow-motion', 'Slow Motion', 'creative',
   'Apply slow motion effect with deliberate movements, emphasized details, smooth slow-motion transitions, and contemplative pacing',
   'Create slow motion video with deliberate movements, emphasized details, and contemplative pacing',
   'Slow, deliberate movements emphasizing details',
   true, 106),

  -- Time-Lapse
  ('time-lapse', 'Time-Lapse', 'creative',
   'Apply time-lapse effect showing accelerated time passage, rapid changes, continuous motion, and temporal progression',
   'Create time-lapse video showing accelerated time passage, rapid changes, and continuous motion',
   'Accelerated time passage showing change over time',
   true, 107),

  -- Vintage Film
  ('vintage', 'Vintage Film', 'artistic',
   'Transform into vintage film style with retro color grading, film grain, vignetting, old film artifacts, nostalgic atmosphere, and classic cinematography',
   'Create vintage film style video with retro color grading, film grain, vignetting, and nostalgic atmosphere',
   'Classic vintage film look with retro aesthetics',
   true, 108),

  -- Glitch Effect
  ('glitch', 'Glitch Effect', 'creative',
   'Apply glitch effects with digital distortion, chromatic aberration, scan lines, data corruption aesthetics, and cyberpunk atmosphere',
   'Create glitch style video with digital distortion, chromatic aberration, and cyberpunk atmosphere',
   'Digital glitch and distortion effects',
   true, 109)

ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;
