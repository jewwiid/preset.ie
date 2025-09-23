-- Create cinematic_presets table
CREATE TABLE IF NOT EXISTS cinematic_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  parameters JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_category ON cinematic_presets(category);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_active ON cinematic_presets(is_active);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_sort ON cinematic_presets(sort_order);

-- Add RLS policies
ALTER TABLE cinematic_presets ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users
CREATE POLICY IF NOT EXISTS "Allow read access to cinematic presets" ON cinematic_presets
  FOR SELECT USING (is_active = true);

-- Allow admin users to manage presets
CREATE POLICY IF NOT EXISTS "Allow admin access to cinematic presets" ON cinematic_presets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role_flags @> '["ADMIN"]'::jsonb
    )
  );

-- Insert default cinematic presets
INSERT INTO cinematic_presets (name, display_name, description, parameters, category, sort_order) VALUES
(
  'portrait',
  'Portrait',
  '9:16 ratio, soft lighting, warm tones, intimate mood',
  '{
    "aspectRatio": "9:16",
    "cameraAngle": "eye-level",
    "lensType": "portrait-85mm",
    "shotSize": "close-up",
    "depthOfField": "shallow-focus",
    "lightingStyle": "soft-light",
    "colorPalette": "warm-golden",
    "compositionTechnique": "rule-of-thirds",
    "sceneMood": "intimate",
    "directorStyle": "sofia-coppola",
    "timeSetting": "golden-hour",
    "subjectCount": "solo",
    "eyeContact": "direct-gaze"
  }'::jsonb,
  'photography',
  1
),
(
  'landscape',
  'Landscape',
  '16:9 ratio, natural light, earth tones, peaceful mood',
  '{
    "aspectRatio": "16:9",
    "cameraAngle": "eye-level",
    "lensType": "wide-angle-24mm",
    "shotSize": "wide-shot",
    "depthOfField": "deep-focus",
    "lightingStyle": "natural-light",
    "colorPalette": "earth-tones",
    "compositionTechnique": "rule-of-thirds",
    "sceneMood": "peaceful",
    "directorStyle": "roger-deakins",
    "timeSetting": "golden-hour",
    "locationType": "countryside",
    "weatherCondition": "sunny"
  }'::jsonb,
  'photography',
  2
),
(
  'cinematic',
  'Cinematic',
  '21:9 ratio, dramatic lighting, teal/orange, low angle',
  '{
    "aspectRatio": "21:9",
    "cameraAngle": "low-angle",
    "lensType": "anamorphic",
    "shotSize": "wide-shot",
    "depthOfField": "shallow-focus",
    "lightingStyle": "chiaroscuro",
    "colorPalette": "teal-and-orange",
    "compositionTechnique": "symmetry",
    "sceneMood": "dramatic",
    "directorStyle": "christopher-nolan",
    "timeSetting": "blue-hour",
    "cameraMovement": "tracking-forward",
    "eraEmulation": "kodak-portra-400"
  }'::jsonb,
  'cinematic',
  3
),
(
  'fashion',
  'Fashion',
  '4:3 ratio, rim lighting, jewel tones, romantic mood',
  '{
    "aspectRatio": "4:3",
    "cameraAngle": "eye-level",
    "lensType": "portrait-85mm",
    "shotSize": "medium-close-up",
    "depthOfField": "shallow-focus",
    "lightingStyle": "rim-lighting",
    "colorPalette": "jewel-tones",
    "compositionTechnique": "rule-of-thirds",
    "sceneMood": "romantic",
    "directorStyle": "bruno-delbonnel",
    "timeSetting": "golden-hour",
    "subjectCount": "solo",
    "eyeContact": "direct-gaze"
  }'::jsonb,
  'photography',
  4
),
(
  'street',
  'Street',
  '3:2 ratio, handheld, monochrome, gritty urban feel',
  '{
    "aspectRatio": "3:2",
    "cameraAngle": "eye-level",
    "lensType": "wide-angle-35mm",
    "shotSize": "medium-shot",
    "depthOfField": "deep-focus",
    "lightingStyle": "natural-light",
    "colorPalette": "monochrome",
    "compositionTechnique": "leading-lines",
    "sceneMood": "gritty",
    "directorStyle": "christopher-doyle",
    "timeSetting": "afternoon",
    "locationType": "urban-street",
    "cameraMovement": "handheld"
  }'::jsonb,
  'photography',
  5
),
(
  'commercial',
  'Commercial',
  '16:9 ratio, high-key lighting, bright, professional',
  '{
    "aspectRatio": "16:9",
    "cameraAngle": "eye-level",
    "lensType": "normal-50mm",
    "shotSize": "medium-shot",
    "depthOfField": "shallow-focus",
    "lightingStyle": "high-key",
    "colorPalette": "high-saturation",
    "compositionTechnique": "central-framing",
    "sceneMood": "bright",
    "directorStyle": "david-fincher",
    "timeSetting": "midday",
    "subjectCount": "solo"
  }'::jsonb,
  'commercial',
  6
),
(
  'artistic',
  'Artistic',
  '1:1 ratio, colored gels, neon palette, surreal mood',
  '{
    "aspectRatio": "1:1",
    "cameraAngle": "dutch-angle",
    "lensType": "fisheye",
    "shotSize": "extreme-close-up",
    "depthOfField": "tilt-shift-effect",
    "lightingStyle": "colored-gels",
    "colorPalette": "neon",
    "compositionTechnique": "diagonal-composition",
    "sceneMood": "surreal",
    "directorStyle": "wes-anderson",
    "timeSetting": "night",
    "eraEmulation": "lomography"
  }'::jsonb,
  'artistic',
  7
),
(
  'documentary',
  'Documentary',
  '16:9 ratio, natural light, desaturated, authentic',
  '{
    "aspectRatio": "16:9",
    "cameraAngle": "eye-level",
    "lensType": "normal-50mm",
    "shotSize": "medium-shot",
    "depthOfField": "deep-focus",
    "lightingStyle": "natural-light",
    "colorPalette": "desaturated",
    "compositionTechnique": "rule-of-thirds",
    "sceneMood": "natural",
    "directorStyle": "terrence-malick",
    "timeSetting": "afternoon",
    "cameraMovement": "handheld"
  }'::jsonb,
  'documentary',
  8
),
(
  'nature',
  'Nature',
  '3:2 ratio, bird''s eye view, earth tones, peaceful',
  '{
    "aspectRatio": "3:2",
    "cameraAngle": "birds-eye-view",
    "lensType": "wide-angle-24mm",
    "shotSize": "extreme-wide-shot",
    "depthOfField": "hyperfocal",
    "lightingStyle": "natural-light",
    "colorPalette": "earth-tones",
    "compositionTechnique": "rule-of-thirds",
    "sceneMood": "peaceful",
    "directorStyle": "terrence-malick",
    "timeSetting": "dawn",
    "locationType": "forest",
    "weatherCondition": "sunny"
  }'::jsonb,
  'photography',
  9
),
(
  'urban',
  'Urban',
  '16:9 ratio, mixed lighting, cool blue, futuristic',
  '{
    "aspectRatio": "16:9",
    "cameraAngle": "low-angle",
    "lensType": "wide-angle-24mm",
    "shotSize": "wide-shot",
    "depthOfField": "deep-focus",
    "lightingStyle": "mixed-lighting",
    "colorPalette": "cool-blue",
    "compositionTechnique": "leading-lines",
    "sceneMood": "futuristic",
    "directorStyle": "denis-villeneuve",
    "timeSetting": "night",
    "locationType": "downtown",
    "cameraMovement": "tracking-forward"
  }'::jsonb,
  'cinematic',
  10
);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_cinematic_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cinematic_presets_updated_at
  BEFORE UPDATE ON cinematic_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_cinematic_presets_updated_at();
