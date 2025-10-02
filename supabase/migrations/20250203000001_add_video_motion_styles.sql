-- Add video motion styles to style_prompts table
-- These styles are specifically for video generation

-- First ensure the table exists (it should from migration 20250122000001)
-- If not, create it
CREATE TABLE IF NOT EXISTS style_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  text_to_image_prompt TEXT NOT NULL,
  image_to_image_prompt TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert video motion styles
-- Using ON CONFLICT to avoid errors if styles already exist

INSERT INTO style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES 
  (
    'smooth',
    'Smooth Motion',
    'Create smooth, fluid motion with gentle camera movements and natural transitions',
    'Apply smooth, fluid motion with gentle camera movements and natural transitions to',
    'Smooth, flowing motion with gentle transitions',
    'motion',
    true,
    100
  )
ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES 
  (
    'fast-paced',
    'Fast-Paced',
    'Create fast-paced, energetic motion with quick cuts and dynamic camera work',
    'Apply fast-paced, energetic motion with quick cuts and dynamic camera work to',
    'High-energy, fast motion with dynamic movement',
    'motion',
    true,
    101
  )
ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES 
  (
    'slow-motion',
    'Slow Motion',
    'Create dramatic slow-motion effect with smooth, deliberate movements and enhanced details',
    'Apply dramatic slow-motion effect with smooth, deliberate movements and enhanced details to',
    'Dramatic slow-motion video effect',
    'motion',
    true,
    102
  )
ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES 
  (
    'time-lapse',
    'Time-Lapse',
    'Create time-lapse effect showing accelerated passage of time with smooth transitions',
    'Apply time-lapse effect showing accelerated passage of time with smooth transitions to',
    'Accelerated time-lapse video',
    'motion',
    true,
    103
  )
ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

INSERT INTO style_prompts (style_name, display_name, text_to_image_prompt, image_to_image_prompt, description, category, is_active, sort_order)
VALUES 
  (
    'glitch',
    'Glitch Effect',
    'Create digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts',
    'Apply digital glitch aesthetic with distorted visuals, chromatic aberration, and digital artifacts to',
    'Digital glitch and distortion effects',
    'artistic',
    true,
    104
  )
ON CONFLICT (style_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  text_to_image_prompt = EXCLUDED.text_to_image_prompt,
  image_to_image_prompt = EXCLUDED.image_to_image_prompt,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_style_prompts_style_name ON style_prompts(style_name);
CREATE INDEX IF NOT EXISTS idx_style_prompts_category ON style_prompts(category);
CREATE INDEX IF NOT EXISTS idx_style_prompts_active ON style_prompts(is_active);

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_style_prompts_updated_at ON style_prompts;
CREATE TRIGGER update_style_prompts_updated_at 
    BEFORE UPDATE ON style_prompts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

