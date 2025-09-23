-- Create style_prompts table to store default prompts for different styles
CREATE TABLE IF NOT EXISTS style_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  style_name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'original', 'photography', 'artistic', 'creative', 'cinematic'
  text_to_image_prompt TEXT NOT NULL,
  image_to_image_prompt TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_style_prompts_style_name ON style_prompts(style_name);
CREATE INDEX IF NOT EXISTS idx_style_prompts_category ON style_prompts(category);
CREATE INDEX IF NOT EXISTS idx_style_prompts_active ON style_prompts(is_active);

-- Insert all the style prompts
INSERT INTO style_prompts (style_name, display_name, category, text_to_image_prompt, image_to_image_prompt, description, sort_order) VALUES
-- Original Styles
('photorealistic', 'Photorealistic', 'original', 'Create a photorealistic image with natural lighting and detailed textures', 'Apply photorealistic rendering with natural lighting and detailed textures', 'High-quality realistic photography style', 1),
('artistic', 'Artistic', 'original', 'Create an artistic painting with creative brushstrokes and vibrant colors', 'Apply an artistic painting style with creative brushstrokes and vibrant colors', 'Creative artistic painting style', 2),
('cartoon', 'Cartoon', 'original', 'Create a cartoon-style illustration with bold outlines and bright colors', 'Transform into a cartoon-style illustration with bold outlines and bright colors', 'Bold cartoon illustration style', 3),
('vintage', 'Vintage', 'original', 'Create a vintage aesthetic with retro colors and nostalgic atmosphere', 'Apply a vintage aesthetic with retro colors and nostalgic atmosphere', 'Retro vintage photography style', 4),
('cyberpunk', 'Cyberpunk', 'original', 'Create a cyberpunk style with neon lights and futuristic elements', 'Apply cyberpunk style with neon lights and futuristic elements', 'Futuristic cyberpunk aesthetic', 5),
('watercolor', 'Watercolor', 'original', 'Create a watercolor painting with soft, flowing colors and translucent effects', 'Apply watercolor painting technique with soft, flowing colors and translucent effects', 'Soft watercolor painting style', 6),
('sketch', 'Sketch', 'original', 'Create a pencil sketch with detailed line work and shading', 'Convert to a pencil sketch style with detailed line work and shading', 'Detailed pencil sketch style', 7),
('oil_painting', 'Oil Painting', 'original', 'Create an oil painting with rich textures and classical art style', 'Apply oil painting technique with rich textures and classical art style', 'Classical oil painting style', 8),

-- Photography Styles
('portrait', 'Portrait', 'photography', 'Create a professional portrait with soft lighting and detailed facial features', 'Transform into a professional portrait with soft lighting and detailed facial features', 'Professional portrait photography', 10),
('fashion', 'Fashion', 'photography', 'Create a fashion photography style with dramatic lighting and elegant composition', 'Apply fashion photography style with dramatic lighting and elegant composition', 'High-end fashion photography', 11),
('editorial', 'Editorial', 'photography', 'Create an editorial photography style with sophisticated lighting and storytelling composition', 'Apply editorial photography style with sophisticated lighting and storytelling composition', 'Magazine editorial photography', 12),
('commercial', 'Commercial', 'photography', 'Create a commercial photography style with clean lighting and professional presentation', 'Apply commercial photography style with clean lighting and professional presentation', 'Professional commercial photography', 13),
('lifestyle', 'Lifestyle', 'photography', 'Create a lifestyle photography style with natural lighting and authentic moments', 'Apply lifestyle photography style with natural lighting and authentic moments', 'Authentic lifestyle photography', 14),
('street', 'Street', 'photography', 'Create a street photography style with candid moments and urban atmosphere', 'Apply street photography style with candid moments and urban atmosphere', 'Urban street photography', 15),
('architecture', 'Architecture', 'photography', 'Create an architectural photography style with clean lines and dramatic perspectives', 'Apply architectural photography style with clean lines and dramatic perspectives', 'Architectural photography', 16),
('nature', 'Nature', 'photography', 'Create a nature photography style with natural lighting and organic textures', 'Apply nature photography style with natural lighting and organic textures', 'Natural outdoor photography', 17),

-- Artistic Styles
('abstract', 'Abstract', 'artistic', 'Create an abstract artwork with bold shapes, colors, and non-representational forms', 'Transform into an abstract artwork with bold shapes, colors, and non-representational forms', 'Non-representational abstract art', 20),
('surreal', 'Surreal', 'artistic', 'Create a surreal artwork with dreamlike imagery and impossible combinations', 'Transform into a surreal artwork with dreamlike imagery and impossible combinations', 'Dreamlike surreal art', 21),
('minimalist', 'Minimalist', 'artistic', 'Create a minimalist artwork with clean lines, simple forms, and negative space', 'Apply minimalist style with clean lines, simple forms, and negative space', 'Clean minimalist design', 22),
('maximalist', 'Maximalist', 'artistic', 'Create a maximalist artwork with rich details, vibrant colors, and complex compositions', 'Apply maximalist style with rich details, vibrant colors, and complex compositions', 'Rich detailed maximalist art', 23),
('impressionist', 'Impressionist', 'artistic', 'Create an impressionist painting with loose brushstrokes and light effects', 'Apply impressionist painting technique with loose brushstrokes and light effects', 'Classical impressionist painting', 24),
('renaissance', 'Renaissance', 'artistic', 'Create a Renaissance-style artwork with classical composition and detailed realism', 'Apply Renaissance painting technique with classical composition and detailed realism', 'Classical Renaissance art', 25),
('baroque', 'Baroque', 'artistic', 'Create a Baroque-style artwork with dramatic lighting and ornate details', 'Apply Baroque painting technique with dramatic lighting and ornate details', 'Dramatic Baroque art', 26),
('art_deco', 'Art Deco', 'artistic', 'Create an Art Deco style with geometric patterns and elegant symmetry', 'Apply Art Deco style with geometric patterns and elegant symmetry', 'Elegant Art Deco design', 27),

-- Creative Styles
('pop_art', 'Pop Art', 'creative', 'Create a Pop Art style with bold colors, commercial imagery, and graphic elements', 'Transform into Pop Art style with bold colors, commercial imagery, and graphic elements', 'Bold Pop Art aesthetic', 30),
('graffiti', 'Graffiti', 'creative', 'Create a graffiti art style with bold lettering, vibrant colors, and urban edge', 'Apply graffiti art style with bold lettering, vibrant colors, and urban edge', 'Urban graffiti art', 31),
('digital_art', 'Digital Art', 'creative', 'Create a digital art style with clean vectors, vibrant colors, and modern aesthetics', 'Apply digital art style with clean vectors, vibrant colors, and modern aesthetics', 'Modern digital art', 32),
('concept_art', 'Concept Art', 'creative', 'Create a concept art style with detailed world-building and imaginative design', 'Apply concept art style with detailed world-building and imaginative design', 'Imaginative concept art', 33),
('fantasy', 'Fantasy', 'creative', 'Create a fantasy art style with magical elements and otherworldly atmosphere', 'Transform into fantasy art style with magical elements and otherworldly atmosphere', 'Magical fantasy art', 34),
('sci_fi', 'Sci-Fi', 'creative', 'Create a sci-fi art style with futuristic technology and space-age aesthetics', 'Apply sci-fi art style with futuristic technology and space-age aesthetics', 'Futuristic sci-fi art', 35),
('steampunk', 'Steampunk', 'creative', 'Create a steampunk style with Victorian-era machinery and brass aesthetics', 'Apply steampunk style with Victorian-era machinery and brass aesthetics', 'Victorian steampunk aesthetic', 36),
('gothic', 'Gothic', 'creative', 'Create a gothic art style with dark atmosphere and ornate details', 'Apply gothic art style with dark atmosphere and ornate details', 'Dark gothic aesthetic', 37),

-- Cinematic Styles
('cinematic', 'Cinematic', 'cinematic', 'Create a cinematic image with dramatic lighting and movie-quality composition', 'Apply cinematic style with dramatic lighting and movie-quality composition', 'Movie-quality cinematic style', 40),
('film_noir', 'Film Noir', 'cinematic', 'Create a film noir style with high contrast lighting and dramatic shadows', 'Apply film noir style with high contrast lighting and dramatic shadows', 'Classic film noir aesthetic', 41),
('dramatic', 'Dramatic', 'cinematic', 'Create a dramatic image with intense lighting and emotional composition', 'Apply dramatic style with intense lighting and emotional composition', 'Emotionally intense dramatic style', 42),
('moody', 'Moody', 'cinematic', 'Create a moody image with atmospheric lighting and emotional depth', 'Apply moody style with atmospheric lighting and emotional depth', 'Atmospheric moody style', 43),
('bright', 'Bright', 'cinematic', 'Create a bright, cheerful image with high-key lighting and vibrant colors', 'Apply bright, cheerful style with high-key lighting and vibrant colors', 'Cheerful bright lighting', 44),
('monochrome', 'Monochrome', 'cinematic', 'Create a monochrome image with high contrast and tonal range', 'Convert to monochrome style with high contrast and tonal range', 'High contrast monochrome', 45),
('sepia', 'Sepia', 'cinematic', 'Create a sepia-toned image with warm, vintage atmosphere', 'Apply sepia tone with warm, vintage atmosphere', 'Warm vintage sepia tone', 46),
('hdr', 'HDR', 'cinematic', 'Create an HDR image with enhanced dynamic range and vivid details', 'Apply HDR processing with enhanced dynamic range and vivid details', 'Enhanced dynamic range processing', 47);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_style_prompts_updated_at 
    BEFORE UPDATE ON style_prompts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
