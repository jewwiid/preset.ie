-- Add video-specific styles to style_prompts table
-- Run this in Supabase SQL Editor

-- Insert Smooth Motion style
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'smooth',
  'Smooth Motion',
  'Create smooth, fluid motion with gentle camera movements and natural transitions',
  'Apply smooth, fluid motion with gentle camera movements and natural transitions to',
  'Smooth, flowing motion with gentle transitions',
  'motion',
  true,
  100
)
ON CONFLICT (style_name) DO NOTHING;

-- Insert Fast-Paced style
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'fast-paced',
  'Fast-Paced',
  'Create fast-paced, energetic motion with quick cuts and dynamic camera work',
  'Apply fast-paced, energetic motion with quick cuts and dynamic camera work to',
  'High-energy, fast motion with dynamic movement',
  'motion',
  true,
  101
)
ON CONFLICT (style_name) DO NOTHING;

-- Insert Slow Motion style
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'slow-motion',
  'Slow Motion',
  'Create dramatic slow-motion effect with smooth, deliberate movements and enhanced details',
  'Apply dramatic slow-motion effect with smooth, deliberate movements and enhanced details to',
  'Dramatic slow-motion video effect',
  'motion',
  true,
  102
)
ON CONFLICT (style_name) DO NOTHING;

-- Insert Time-Lapse style
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'time-lapse',
  'Time-Lapse',
  'Create time-lapse effect showing accelerated passage of time with smooth transitions',
  'Apply time-lapse effect showing accelerated passage of time with smooth transitions to',
  'Accelerated time-lapse video',
  'motion',
  true,
  103
)
ON CONFLICT (style_name) DO NOTHING;

-- Insert Glitch Effect style
INSERT INTO public.style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES (
  'glitch',
  'Glitch Effect',
  'Create digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts',
  'Apply digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts to',
  'Digital glitch and distortion effects',
  'artistic',
  true,
  104
)
ON CONFLICT (style_name) DO NOTHING;

-- Verify the inserts
SELECT style_name, display_name, category FROM public.style_prompts
WHERE style_name IN ('smooth', 'fast-paced', 'slow-motion', 'time-lapse', 'glitch')
ORDER BY sort_order;
