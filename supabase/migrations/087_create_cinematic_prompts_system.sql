-- Create comprehensive cinematic prompts system
-- This migration adds tables for predefined prompts, custom directors, and scene moods

-- Create cinematic_prompt_templates table
CREATE TABLE IF NOT EXISTS public.cinematic_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('portrait', 'landscape', 'street', 'cinematic', 'artistic', 'commercial', 'fashion', 'architecture', 'nature', 'abstract')),
  base_prompt TEXT NOT NULL,
  cinematic_parameters JSONB NOT NULL DEFAULT '{}',
  difficulty VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_directors table
CREATE TABLE IF NOT EXISTS public.custom_directors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visual_style TEXT,
  signature_elements TEXT[] DEFAULT '{}',
  example_prompts TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, created_by)
);

-- Create custom_scene_moods table
CREATE TABLE IF NOT EXISTS public.custom_scene_moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color_palette VARCHAR(100),
  lighting_style VARCHAR(100),
  atmosphere_description TEXT,
  example_prompts TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.users_profile(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, created_by)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cinematic_prompt_templates_category ON public.cinematic_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_cinematic_prompt_templates_difficulty ON public.cinematic_prompt_templates(difficulty);
CREATE INDEX IF NOT EXISTS idx_cinematic_prompt_templates_tags ON public.cinematic_prompt_templates USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_cinematic_prompt_templates_cinematic_params ON public.cinematic_prompt_templates USING GIN (cinematic_parameters);
CREATE INDEX IF NOT EXISTS idx_cinematic_prompt_templates_public ON public.cinematic_prompt_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_custom_directors_created_by ON public.custom_directors(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_directors_public ON public.custom_directors(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_directors_name ON public.custom_directors(name);

CREATE INDEX IF NOT EXISTS idx_custom_scene_moods_created_by ON public.custom_scene_moods(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_scene_moods_public ON public.custom_scene_moods(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_scene_moods_name ON public.custom_scene_moods(name);

-- Insert comprehensive predefined prompt templates
INSERT INTO public.cinematic_prompt_templates (name, description, category, base_prompt, cinematic_parameters, difficulty, tags) VALUES

-- Portrait Templates
('Professional Headshot', 'Clean, professional portrait with studio lighting', 'portrait', 'professional headshot of {subject}', '{"cameraAngle": "eye-level", "lensType": "portrait-85mm", "shotSize": "close-up", "lightingStyle": "soft-light", "colorPalette": "warm-golden", "sceneMood": "professional"}', 'beginner', '{"portrait", "professional", "headshot"}'),

('Dramatic Portrait', 'High-contrast portrait with dramatic lighting', 'portrait', 'dramatic portrait of {subject}', '{"cameraAngle": "low-angle", "lensType": "portrait-85mm", "shotSize": "close-up", "lightingStyle": "chiaroscuro", "colorPalette": "desaturated", "sceneMood": "dramatic"}', 'intermediate', '{"portrait", "dramatic", "chiaroscuro"}'),

('Wes Anderson Portrait', 'Symmetrical portrait with pastel colors', 'portrait', 'portrait of {subject} in Wes Anderson style', '{"cameraAngle": "eye-level", "lensType": "portrait-85mm", "shotSize": "medium-shot", "lightingStyle": "soft-light", "colorPalette": "pastel", "directorStyle": "wes-anderson", "sceneMood": "nostalgic", "compositionTechnique": "symmetry"}', 'advanced', '{"portrait", "wes-anderson", "symmetrical", "pastel"}'),

-- Landscape Templates
('Epic Landscape', 'Wide, dramatic landscape with natural lighting', 'landscape', 'epic landscape of {location}', '{"cameraAngle": "eye-level", "lensType": "wide-angle-24mm", "shotSize": "wide-shot", "lightingStyle": "natural-light", "colorPalette": "warm-golden", "sceneMood": "epic", "depthOfField": "deep-focus"}', 'beginner', '{"landscape", "epic", "natural"}'),

('Golden Hour Landscape', 'Warm, golden hour landscape photography', 'landscape', 'golden hour landscape of {location}', '{"cameraAngle": "eye-level", "lensType": "wide-angle-35mm", "shotSize": "wide-shot", "lightingStyle": "natural-light", "colorPalette": "warm-golden", "timeSetting": "golden-hour", "sceneMood": "peaceful"}', 'intermediate', '{"landscape", "golden-hour", "warm"}'),

('Deakins Landscape', 'Naturalistic landscape in Roger Deakins style', 'landscape', 'landscape of {location} in Roger Deakins style', '{"cameraAngle": "eye-level", "lensType": "wide-angle-24mm", "shotSize": "wide-shot", "lightingStyle": "natural-light", "directorStyle": "roger-deakins", "sceneMood": "peaceful", "colorPalette": "earth-tones"}', 'advanced', '{"landscape", "roger-deakins", "naturalistic"}'),

-- Cinematic Templates
('Film Noir Scene', 'High contrast black and white cinematic scene', 'cinematic', 'film noir scene with {subject}', '{"cameraAngle": "low-angle", "lensType": "anamorphic", "shotSize": "medium-shot", "lightingStyle": "chiaroscuro", "colorPalette": "monochrome", "sceneMood": "mysterious", "aspectRatio": "2.39:1"}', 'advanced', '{"cinematic", "film-noir", "monochrome"}'),

('Fincher Style', 'Desaturated, precise cinematic style', 'cinematic', 'scene in David Fincher style with {subject}', '{"cameraAngle": "eye-level", "lensType": "anamorphic", "shotSize": "medium-shot", "lightingStyle": "low-key", "colorPalette": "desaturated", "directorStyle": "david-fincher", "sceneMood": "tense", "cameraMovement": "smooth"}', 'advanced', '{"cinematic", "david-fincher", "desaturated"}'),

('Malick Natural', 'Poetic, natural lighting in Terrence Malick style', 'cinematic', 'natural scene with {subject} in Terrence Malick style', '{"cameraAngle": "handheld", "lensType": "normal-50mm", "shotSize": "medium-shot", "lightingStyle": "natural-light", "directorStyle": "terrence-malick", "sceneMood": "peaceful", "cameraMovement": "handheld"}', 'advanced', '{"cinematic", "terrence-malick", "natural", "poetic"}'),

-- Street Photography Templates
('Urban Street', 'Dynamic street photography with natural lighting', 'street', 'street photography of {subject} in urban environment', '{"cameraAngle": "eye-level", "lensType": "normal-50mm", "shotSize": "medium-shot", "lightingStyle": "natural-light", "sceneMood": "dynamic", "locationType": "urban-street"}', 'beginner', '{"street", "urban", "dynamic"}'),

('Doyle Neon', 'Expressive street photography with neon lighting', 'street', 'neon-lit street scene with {subject}', '{"cameraAngle": "handheld", "lensType": "wide-angle-35mm", "shotSize": "medium-shot", "lightingStyle": "colored-gels", "colorPalette": "neon", "directorStyle": "christopher-doyle", "sceneMood": "futuristic", "cameraMovement": "handheld"}', 'advanced', '{"street", "neon", "christopher-doyle"}'),

-- Fashion Templates
('Fashion Editorial', 'High-fashion editorial photography', 'fashion', 'fashion editorial of {subject}', '{"cameraAngle": "eye-level", "lensType": "portrait-85mm", "shotSize": "medium-shot", "lightingStyle": "high-key", "colorPalette": "high-saturation", "sceneMood": "dramatic"}', 'intermediate', '{"fashion", "editorial", "high-key"}'),

('Vintage Fashion', 'Retro fashion photography with film grain', 'fashion', 'vintage fashion photography of {subject}', '{"cameraAngle": "eye-level", "lensType": "portrait-85mm", "shotSize": "medium-shot", "lightingStyle": "soft-light", "colorPalette": "sepia", "sceneMood": "nostalgic", "eraEmulation": "vintage-16mm-grain"}', 'intermediate', '{"fashion", "vintage", "retro"}'),

-- Architecture Templates
('Modern Architecture', 'Clean, minimalist architectural photography', 'architecture', 'modern architecture of {building}', '{"cameraAngle": "eye-level", "lensType": "wide-angle-24mm", "shotSize": "wide-shot", "lightingStyle": "natural-light", "colorPalette": "desaturated", "sceneMood": "minimalist", "compositionTechnique": "leading-lines"}', 'intermediate', '{"architecture", "modern", "minimalist"}'),

('Gothic Architecture', 'Dramatic gothic architecture with moody lighting', 'architecture', 'gothic architecture of {building}', '{"cameraAngle": "low-angle", "lensType": "wide-angle-24mm", "shotSize": "wide-shot", "lightingStyle": "chiaroscuro", "colorPalette": "desaturated", "sceneMood": "mysterious", "timeSetting": "dusk"}', 'advanced', '{"architecture", "gothic", "dramatic"}'),

-- Nature Templates
('Forest Path', 'Peaceful forest scene with natural lighting', 'nature', 'forest path with {subject}', '{"cameraAngle": "eye-level", "lensType": "wide-angle-35mm", "shotSize": "wide-shot", "lightingStyle": "natural-light", "colorPalette": "earth-tones", "sceneMood": "peaceful", "locationType": "forest"}', 'beginner', '{"nature", "forest", "peaceful"}'),

('Mountain Vista', 'Epic mountain landscape with dramatic sky', 'nature', 'mountain vista with {subject}', '{"cameraAngle": "eye-level", "lensType": "wide-angle-24mm", "shotSize": "extreme-wide-shot", "lightingStyle": "natural-light", "colorPalette": "earth-tones", "sceneMood": "epic", "locationType": "mountain"}', 'intermediate', '{"nature", "mountain", "epic"}'),

-- Abstract Templates
('Abstract Art', 'Creative abstract composition', 'abstract', 'abstract art with {subject}', '{"cameraAngle": "dutch-angle", "lensType": "fisheye", "shotSize": "medium-shot", "lightingStyle": "colored-gels", "colorPalette": "high-saturation", "sceneMood": "surreal", "compositionTechnique": "diagonal-composition"}', 'advanced', '{"abstract", "creative", "surreal"}'),

('Minimalist Abstract', 'Clean, minimalist abstract composition', 'abstract', 'minimalist abstract with {subject}', '{"cameraAngle": "eye-level", "lensType": "normal-50mm", "shotSize": "medium-shot", "lightingStyle": "soft-light", "colorPalette": "desaturated", "sceneMood": "minimalist", "compositionTechnique": "negative-space"}', 'intermediate', '{"abstract", "minimalist", "clean"}');

-- Insert some popular custom directors
INSERT INTO public.custom_directors (name, description, visual_style, signature_elements, example_prompts, is_public) VALUES
('Christopher Nolan', 'Dark, complex narratives with practical effects', 'High contrast, desaturated colors, practical lighting', '{"practical-effects", "dark-tones", "complex-composition", "imax-format"}', '{"dark, complex scene with practical lighting", "high contrast composition with desaturated colors", "imax format wide shot with dramatic lighting"}', true),

('Denis Villeneuve', 'Minimalist, atmospheric cinematography', 'Wide compositions, muted colors, atmospheric lighting', '{"minimalist-composition", "atmospheric-lighting", "muted-colors", "wide-shots"}', '{"minimalist wide shot with atmospheric lighting", "muted color palette with wide composition", "atmospheric scene with minimalist approach"}', true),

('Greta Gerwig', 'Natural, authentic storytelling with warm tones', 'Natural lighting, warm colors, authentic moments', '{"natural-lighting", "warm-tones", "authentic-moments", "natural-composition"}', '{"natural lighting with warm tones", "authentic moment with natural composition", "warm, natural scene with authentic feel"}', true),

('Jordan Peele', 'Social commentary with horror elements', 'High contrast, symbolic imagery, dramatic lighting', '{"high-contrast", "symbolic-imagery", "dramatic-lighting", "social-commentary"}', '{"high contrast scene with symbolic imagery", "dramatic lighting with social commentary", "symbolic composition with dramatic contrast"}', true);

-- Insert some popular custom scene moods
INSERT INTO public.custom_scene_moods (name, description, color_palette, lighting_style, atmosphere_description, example_prompts, is_public) VALUES
('Cyberpunk Neon', 'Futuristic urban environment with neon lighting', 'neon', 'colored-gels', 'High-tech urban environment with vibrant neon lights, rain-soaked streets, and futuristic architecture', '{"neon-lit cyberpunk street scene", "futuristic urban environment with neon lights", "rain-soaked cyberpunk cityscape"}', true),

('Cozy Autumn', 'Warm, inviting autumn atmosphere', 'warm-golden', 'natural-light', 'Warm autumn day with golden light, cozy atmosphere, and natural textures', '{"cozy autumn scene with warm lighting", "golden hour autumn atmosphere", "warm, inviting autumn setting"}', true),

('Melancholic Rain', 'Sad, contemplative mood with rain', 'cool-blue', 'natural-light', 'Rainy day with overcast sky, contemplative mood, and cool blue tones', '{"melancholic rainy day scene", "contemplative mood with rain", "overcast sky with cool blue tones"}', true),

('Ethereal Dream', 'Soft, otherworldly atmosphere', 'pastel', 'soft-light', 'Dreamlike quality with soft lighting, ethereal atmosphere, and pastel colors', '{"ethereal dreamlike scene", "soft, otherworldly atmosphere", "dreamy scene with pastel colors"}', true),

('Industrial Grit', 'Raw, urban industrial environment', 'desaturated', 'hard-light', 'Raw industrial setting with harsh lighting, metallic surfaces, and urban decay', '{"gritty industrial scene", "raw urban environment", "harsh industrial lighting"}', true);

-- Create RLS policies
ALTER TABLE public.cinematic_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_directors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_scene_moods ENABLE ROW LEVEL SECURITY;

-- Policies for cinematic_prompt_templates
CREATE POLICY "Anyone can view public cinematic prompt templates" ON public.cinematic_prompt_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own cinematic prompt templates" ON public.cinematic_prompt_templates
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create cinematic prompt templates" ON public.cinematic_prompt_templates
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own cinematic prompt templates" ON public.cinematic_prompt_templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own cinematic prompt templates" ON public.cinematic_prompt_templates
  FOR DELETE USING (created_by = auth.uid());

-- Policies for custom_directors
CREATE POLICY "Anyone can view public custom directors" ON public.custom_directors
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own custom directors" ON public.custom_directors
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create custom directors" ON public.custom_directors
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own custom directors" ON public.custom_directors
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own custom directors" ON public.custom_directors
  FOR DELETE USING (created_by = auth.uid());

-- Policies for custom_scene_moods
CREATE POLICY "Anyone can view public custom scene moods" ON public.custom_scene_moods
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own custom scene moods" ON public.custom_scene_moods
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create custom scene moods" ON public.custom_scene_moods
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own custom scene moods" ON public.custom_scene_moods
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own custom scene moods" ON public.custom_scene_moods
  FOR DELETE USING (created_by = auth.uid());

-- Create functions to update usage counts
CREATE OR REPLACE FUNCTION increment_cinematic_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.cinematic_prompt_templates 
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_custom_director_usage(director_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_directors 
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE id = director_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_custom_mood_usage(mood_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_scene_moods 
  SET usage_count = usage_count + 1, updated_at = NOW()
  WHERE id = mood_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE public.cinematic_prompt_templates IS 'Predefined cinematic prompt templates with parameters';
COMMENT ON TABLE public.custom_directors IS 'User-created custom director styles';
COMMENT ON TABLE public.custom_scene_moods IS 'User-created custom scene moods';
