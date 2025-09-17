-- Add all cinematic parameters to database for dynamic fetching
-- This migration adds tables for all cinematic parameter types

-- Create camera_angles table
CREATE TABLE IF NOT EXISTS public.camera_angles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'camera',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lens_types table
CREATE TABLE IF NOT EXISTS public.lens_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'lens',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shot_sizes table
CREATE TABLE IF NOT EXISTS public.shot_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'shot',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create depth_of_field table
CREATE TABLE IF NOT EXISTS public.depth_of_field (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'focus',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create composition_techniques table
CREATE TABLE IF NOT EXISTS public.composition_techniques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'composition',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lighting_styles table
CREATE TABLE IF NOT EXISTS public.lighting_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'lighting',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create color_palettes table
CREATE TABLE IF NOT EXISTS public.color_palettes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'color',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create era_emulations table
CREATE TABLE IF NOT EXISTS public.era_emulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'era',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scene_moods table (predefined moods)
CREATE TABLE IF NOT EXISTS public.scene_moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'mood',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create camera_movements table
CREATE TABLE IF NOT EXISTS public.camera_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'movement',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create aspect_ratios table
CREATE TABLE IF NOT EXISTS public.aspect_ratios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'aspect',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create time_settings table
CREATE TABLE IF NOT EXISTS public.time_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'time',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weather_conditions table
CREATE TABLE IF NOT EXISTS public.weather_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'weather',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create location_types table
CREATE TABLE IF NOT EXISTS public.location_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'location',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create foreground_elements table
CREATE TABLE IF NOT EXISTS public.foreground_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'foreground',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subject_counts table
CREATE TABLE IF NOT EXISTS public.subject_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'subject',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create eye_contacts table
CREATE TABLE IF NOT EXISTS public.eye_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'eye',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Camera Angles
INSERT INTO public.camera_angles (value, label, description) VALUES
('high-angle', 'High Angle', 'Camera looks down on subject, making them appear smaller/vulnerable'),
('low-angle', 'Low Angle', 'Camera looks up at subject, giving them power/dominance'),
('eye-level', 'Eye Level', 'Camera at same height as subject''s eyes; neutral and natural'),
('worms-eye-view', 'Worm''s Eye View', 'Extremely low, almost at ground level'),
('birds-eye-view', 'Bird''s Eye View', 'Overhead shot looking straight down'),
('dutch-angle', 'Dutch Angle', 'Camera tilted to create tension or unease'),
('over-the-shoulder', 'Over the Shoulder', 'Camera positioned behind one subject looking at another'),
('point-of-view', 'Point of View', 'Camera represents character''s perspective'),
('canted-angle', 'Canted Angle', 'Slight tilt for dynamic composition');

-- Insert Lens Types
INSERT INTO public.lens_types (value, label, description) VALUES
('wide-angle-24mm', 'Wide Angle 24mm', 'Exaggerates perspective, suitable for landscapes'),
('wide-angle-35mm', 'Wide Angle 35mm', 'Slightly wide, good for environmental portraits'),
('normal-50mm', 'Normal 50mm', 'Approximates human vision; versatile'),
('portrait-85mm', 'Portrait 85mm', 'Compresses perspective, ideal for portraits'),
('telephoto-135mm', 'Telephoto 135mm', 'Strong compression, isolates subjects'),
('telephoto-200mm', 'Telephoto 200mm', 'Extreme compression for distant subjects'),
('macro-lens', 'Macro Lens', 'Extreme close-ups with fine detail'),
('fisheye', 'Fisheye', 'Ultra-wide, high distortion for creative effects'),
('anamorphic', 'Anamorphic', 'Squeezes wide scene onto narrower sensor'),
('tilt-shift', 'Tilt Shift', 'Selective focus that can miniaturize scenes');

-- Insert Shot Sizes
INSERT INTO public.shot_sizes (value, label, description) VALUES
('extreme-close-up', 'Extreme Close Up', 'Captures small details like eyes or hands'),
('close-up', 'Close Up', 'Shows head and shoulders, emphasizes emotion'),
('medium-close-up', 'Medium Close Up', 'Shows head and upper chest'),
('medium-shot', 'Medium Shot', 'Frames subject from waist up'),
('medium-long-shot', 'Medium Long Shot', 'Shows subject from knees up'),
('wide-shot', 'Wide Shot', 'Shows full body and environment'),
('extreme-wide-shot', 'Extreme Wide Shot', 'Emphasizes environment over subject'),
('establishing-shot', 'Establishing Shot', 'Sets the scene and location');

-- Insert Depth of Field
INSERT INTO public.depth_of_field (value, label, description) VALUES
('shallow-focus', 'Shallow Focus', 'Only subject is sharp, background heavily blurred'),
('deep-focus', 'Deep Focus', 'Both foreground and background are sharp'),
('rack-focus', 'Rack Focus', 'Focus shifts during shot from one subject to another'),
('tilt-shift-effect', 'Tilt Shift Effect', 'Selective focus that miniaturizes scene'),
('bokeh-heavy', 'Bokeh Heavy', 'Very shallow DOF with prominent background blur'),
('hyperfocal', 'Hyperfocal', 'Maximum depth of field for landscape photography');

-- Insert Composition Techniques
INSERT INTO public.composition_techniques (value, label, description) VALUES
('rule-of-thirds', 'Rule of Thirds', 'Subject positioned along thirds lines'),
('central-framing', 'Central Framing', 'Subject placed at center; symmetrical and formal'),
('symmetry', 'Symmetry', 'Balanced composition with mirrored elements'),
('leading-lines', 'Leading Lines', 'Lines guide viewer''s eye toward subject'),
('negative-space', 'Negative Space', 'Empty areas create breathing room'),
('golden-ratio', 'Golden Ratio', 'Composition follows Fibonacci spiral'),
('diagonal-composition', 'Diagonal Composition', 'Dynamic diagonal lines'),
('frame-within-frame', 'Frame Within Frame', 'Using elements to frame the subject'),
('triangular-composition', 'Triangular Composition', 'Elements arranged in triangular pattern'),
('radial-composition', 'Radial Composition', 'Elements radiate from central point');

-- Insert Lighting Styles
INSERT INTO public.lighting_styles (value, label, description) VALUES
('natural-light', 'Natural Light', 'Sunlight or available light without artificial sources'),
('high-key', 'High Key', 'Bright, evenly lit with minimal shadows'),
('low-key', 'Low Key', 'Dominated by dark tones with strong shadows'),
('chiaroscuro', 'Chiaroscuro', 'Contrast between light and dark for dramatic effect'),
('backlit-silhouette', 'Backlit Silhouette', 'Light source behind subject creates silhouette'),
('rim-lighting', 'Rim Lighting', 'Light from behind creates edge definition'),
('side-lighting', 'Side Lighting', 'Light from the side creates depth and texture'),
('top-lighting', 'Top Lighting', 'Light from above creates dramatic shadows'),
('bottom-lighting', 'Bottom Lighting', 'Light from below creates eerie, unnatural look'),
('colored-gels', 'Colored Gels', 'Colored lights (neon pink, blue, etc.)'),
('practical-lighting', 'Practical Lighting', 'Using visible light sources in the scene'),
('hard-light', 'Hard Light', 'Sharp, defined shadows'),
('soft-light', 'Soft Light', 'Diffused, gentle shadows'),
('mixed-lighting', 'Mixed Lighting', 'Combination of different light sources'),
('volumetric-lighting', 'Volumetric Lighting', 'Visible light rays/beams');

-- Insert Color Palettes
INSERT INTO public.color_palettes (value, label, description) VALUES
('warm-golden', 'Warm Golden', 'Oranges, yellows, reds; evokes warmth/nostalgia'),
('cool-blue', 'Cool Blue', 'Blues and greens; creates somber/futuristic feel'),
('monochrome', 'Monochrome', 'Black and white; emphasizes texture/contrast'),
('sepia', 'Sepia', 'Brownish tones reminiscent of aged photographs'),
('desaturated', 'Desaturated', 'Muted colors for realism or melancholy'),
('high-saturation', 'High Saturation', 'Vivid, punchy colors'),
('pastel', 'Pastel', 'Soft, muted colors'),
('neon', 'Neon', 'Bright, electric colors'),
('earth-tones', 'Earth Tones', 'Natural browns, greens, tans'),
('jewel-tones', 'Jewel Tones', 'Rich, deep colors like emerald, ruby, sapphire'),
('film-stock-emulation', 'Film Stock Emulation', 'Specific color profiles (Kodak Portra, Fuji Velvia)'),
('teal-and-orange', 'Teal and Orange', 'Popular cinematic color grading'),
('split-toning', 'Split Toning', 'Different colors for highlights and shadows'),
('cross-processing', 'Cross Processing', 'Unconventional color processing'),
('vintage-wash', 'Vintage Wash', 'Aged, faded color treatment');

-- Insert Era Emulations
INSERT INTO public.era_emulations (value, label, description) VALUES
('vintage-16mm-grain', 'Vintage 16mm Grain', 'Coarse grain and muted colors'),
('super-8', 'Super 8', 'Home-movie aesthetic with streaks and faded tones'),
('1970s-bleach-bypass', '1970s Bleach Bypass', 'High contrast, desaturated colors'),
('1980s-vhs', '1980s VHS', 'Low resolution, color bleeding, scan lines'),
('1990s-film', '1990s Film', 'Balanced colors with subtle grain'),
('kodak-portra-400', 'Kodak Portra 400', 'Balanced colors and soft contrast'),
('fuji-velvia-50', 'Fuji Velvia 50', 'Vivid saturation and punchy contrast'),
('kodak-tri-x', 'Kodak Tri-X', 'High contrast black and white'),
('ilford-hp5', 'Ilford HP5', 'Fine grain black and white'),
('polaroid-instant', 'Polaroid Instant', 'Soft colors, slight vignetting'),
('lomography', 'Lomography', 'Artistic imperfections, color shifts'),
('daguerreotype', 'Daguerreotype', 'Early photographic process aesthetic'),
('tintype', 'Tintype', 'Metallic sheen, high contrast'),
('cyanotype', 'Cyanotype', 'Blue-toned monochrome'),
('sepia-toned', 'Sepia Toned', 'Warm brown monochrome');

-- Insert Scene Moods (predefined)
INSERT INTO public.scene_moods (value, label, description) VALUES
('gritty', 'Gritty', 'Dark, textured visuals; often desaturated'),
('dreamlike', 'Dreamlike', 'Soft focus, haze, pastel colors'),
('futuristic', 'Futuristic', 'Sleek lines, cool color palettes, neon lights'),
('romantic', 'Romantic', 'Warm tones, soft lighting, intimate composition'),
('action-packed', 'Action Packed', 'Dynamic camera angles and motion blur'),
('film-noir', 'Film Noir', 'High contrast, Venetian blind shadows'),
('melancholic', 'Melancholic', 'Subdued colors, soft lighting, contemplative'),
('mysterious', 'Mysterious', 'Dark tones, dramatic shadows, enigmatic'),
('nostalgic', 'Nostalgic', 'Warm colors, soft focus, vintage elements'),
('dramatic', 'Dramatic', 'High contrast, bold compositions, intense'),
('peaceful', 'Peaceful', 'Soft colors, gentle lighting, serene'),
('tense', 'Tense', 'Sharp angles, harsh lighting, claustrophobic'),
('epic', 'Epic', 'Wide compositions, dramatic lighting, grand scale'),
('intimate', 'Intimate', 'Close compositions, soft lighting, personal'),
('surreal', 'Surreal', 'Unusual compositions, unexpected elements'),
('minimalist', 'Minimalist', 'Clean lines, simple compositions, reduced elements'),
('baroque', 'Baroque', 'Ornate, complex compositions, rich details'),
('industrial', 'Industrial', 'Harsh lighting, metallic surfaces, urban decay'),
('natural', 'Natural', 'Organic shapes, natural lighting, earthy tones'),
('ethereal', 'Ethereal', 'Soft, otherworldly, luminous');

-- Insert Camera Movements
INSERT INTO public.camera_movements (value, label, description) VALUES
('static', 'Static', 'Camera does not move'),
('pan-left', 'Pan Left', 'Horizontal rotation left'),
('pan-right', 'Pan Right', 'Horizontal rotation right'),
('tilt-up', 'Tilt Up', 'Vertical rotation up'),
('tilt-down', 'Tilt Down', 'Vertical rotation down'),
('handheld', 'Handheld', 'Organically shaky movement'),
('tracking-forward', 'Tracking Forward', 'Camera moves smoothly forward'),
('tracking-backward', 'Tracking Backward', 'Camera moves smoothly backward'),
('tracking-left', 'Tracking Left', 'Camera moves smoothly left'),
('tracking-right', 'Tracking Right', 'Camera moves smoothly right'),
('dolly-in', 'Dolly In', 'Camera moves toward subject'),
('dolly-out', 'Dolly Out', 'Camera moves away from subject'),
('crane-up', 'Crane Up', 'Camera moves vertically up'),
('crane-down', 'Crane Down', 'Camera moves vertically down'),
('orbit-clockwise', 'Orbit Clockwise', 'Camera circles around subject clockwise'),
('orbit-counterclockwise', 'Orbit Counterclockwise', 'Camera circles around subject counterclockwise'),
('zoom-in', 'Zoom In', 'Lens zoom toward subject'),
('zoom-out', 'Zoom Out', 'Lens zoom away from subject'),
('push-pull', 'Push Pull', 'Combination of dolly and zoom'),
('whip-pan', 'Whip Pan', 'Fast horizontal movement'),
('snap-zoom', 'Snap Zoom', 'Quick zoom in or out'),
('floating', 'Floating', 'Smooth, floating movement'),
('shaky', 'Shaky', 'Intentionally unsteady movement'),
('smooth', 'Smooth', 'Very steady, controlled movement'),
('jerky', 'Jerky', 'Sudden, abrupt movements'),
('spiral', 'Spiral', 'Spiral movement around subject'),
('figure-eight', 'Figure Eight', 'Figure-eight movement pattern'),
('pendulum', 'Pendulum', 'Back and forth swinging movement'),
('free-fall', 'Free Fall', 'Downward movement'),
('ascending', 'Ascending', 'Upward movement');

-- Insert Aspect Ratios
INSERT INTO public.aspect_ratios (value, label, description) VALUES
('1:1', '1:1 Square', 'Square frame, social media'),
('4:3', '4:3 Standard', 'Classic television and early cinema'),
('16:9', '16:9 Widescreen', 'Standard widescreen for modern video'),
('21:9', '21:9 Ultra-wide', 'Ultra-wide cinematic'),
('2.39:1', '2.39:1 Cinemascope', 'Cinemascope anamorphic widescreen'),
('2.35:1', '2.35:1 Anamorphic', 'Standard anamorphic widescreen'),
('1.85:1', '1.85:1 Academy Flat', 'Academy flat widescreen'),
('9:16', '9:16 Vertical', 'Vertical video for mobile platforms'),
('3:2', '3:2 Photography', 'Standard photography aspect ratio'),
('5:4', '5:4 Large Format', 'Large format photography'),
('6:7', '6:7 Medium Format', 'Medium format photography'),
('golden-ratio', 'Golden Ratio', '1.618:1 golden ratio'),
('cinema-scope', 'Cinema Scope', '2.35:1 cinema scope'),
('vista-vision', 'Vista Vision', '1.85:1 vista vision'),
('imax', 'IMAX', '1.43:1 IMAX format'),
('full-frame', 'Full Frame', '3:2 full frame sensor'),
('aps-c', 'APS-C', '3:2 APS-C sensor'),
('micro-four-thirds', 'Micro Four Thirds', '4:3 micro four thirds'),
('medium-format', 'Medium Format', '6:7 medium format'),
('large-format', 'Large Format', '5:4 large format');

-- Insert Time Settings
INSERT INTO public.time_settings (value, label, description) VALUES
('dawn', 'Dawn', 'Early morning, soft golden light'),
('morning', 'Morning', 'Bright morning light'),
('midday', 'Midday', 'Harsh overhead light'),
('afternoon', 'Afternoon', 'Warm afternoon light'),
('golden-hour', 'Golden Hour', 'Warm, soft light before sunset'),
('sunset', 'Sunset', 'Dramatic orange and red light'),
('dusk', 'Dusk', 'Dimming light, blue hour'),
('twilight', 'Twilight', 'Between day and night'),
('night', 'Night', 'Dark with artificial lighting'),
('midnight', 'Midnight', 'Deepest night'),
('blue-hour', 'Blue Hour', 'Blue-tinted light after sunset'),
('magic-hour', 'Magic Hour', 'Optimal lighting conditions'),
('high-noon', 'High Noon', 'Bright, harsh midday sun'),
('late-afternoon', 'Late Afternoon', 'Warm, angled light'),
('early-evening', 'Early Evening', 'Transitioning to night'),
('late-night', 'Late Night', 'Deep night with minimal light'),
('pre-dawn', 'Pre Dawn', 'Very early morning'),
('post-sunset', 'Post Sunset', 'After sunset, before full dark'),
('overcast-day', 'Overcast Day', 'Cloudy, diffused light'),
('stormy-weather', 'Stormy Weather', 'Dramatic, changing light');

-- Insert Weather Conditions
INSERT INTO public.weather_conditions (value, label, description) VALUES
('sunny', 'Sunny', 'Clear skies, bright light'),
('partly-cloudy', 'Partly Cloudy', 'Mix of sun and clouds'),
('overcast', 'Overcast', 'Cloudy, diffused light'),
('foggy', 'Foggy', 'Misty, atmospheric'),
('rainy', 'Rainy', 'Wet, reflective surfaces'),
('stormy', 'Stormy', 'Dramatic, changing conditions'),
('snowy', 'Snowy', 'Cold, bright, clean'),
('windy', 'Windy', 'Moving elements, dynamic'),
('humid', 'Humid', 'Moist, hazy atmosphere'),
('dry', 'Dry', 'Clear, crisp conditions'),
('hazy', 'Hazy', 'Soft, diffused light'),
('crisp', 'Crisp', 'Clear, sharp conditions'),
('misty', 'Misty', 'Soft, mysterious atmosphere'),
('drizzly', 'Drizzly', 'Light rain, moody'),
('torrential', 'Torrential', 'Heavy rain, dramatic'),
('blizzard', 'Blizzard', 'Heavy snow, whiteout'),
('sandstorm', 'Sandstorm', 'Dusty, obscured conditions'),
('heat-wave', 'Heat Wave', 'Hot, shimmering air'),
('freezing', 'Freezing', 'Cold, crisp conditions'),
('tropical', 'Tropical', 'Warm, humid conditions');

-- Insert Location Types
INSERT INTO public.location_types (value, label, description) VALUES
('urban-street', 'Urban Street', 'City street with buildings'),
('rural-field', 'Rural Field', 'Open countryside'),
('forest', 'Forest', 'Wooded area'),
('desert', 'Desert', 'Arid landscape'),
('mountain', 'Mountain', 'Elevated terrain'),
('beach', 'Beach', 'Coastal area'),
('lake', 'Lake', 'Freshwater body'),
('ocean', 'Ocean', 'Seawater body'),
('park', 'Park', 'Urban green space'),
('garden', 'Garden', 'Cultivated outdoor space'),
('rooftop', 'Rooftop', 'Elevated urban space'),
('alleyway', 'Alleyway', 'Narrow urban passage'),
('highway', 'Highway', 'Major road'),
('bridge', 'Bridge', 'Overpass or water crossing'),
('tunnel', 'Tunnel', 'Underground passage'),
('courtyard', 'Courtyard', 'Enclosed outdoor space'),
('plaza', 'Plaza', 'Open urban square'),
('marketplace', 'Marketplace', 'Commercial outdoor area'),
('playground', 'Playground', 'Recreational outdoor space'),
('cemetery', 'Cemetery', 'Burial ground'),
('ruins', 'Ruins', 'Abandoned structures'),
('construction-site', 'Construction Site', 'Building in progress'),
('industrial-area', 'Industrial Area', 'Manufacturing zone'),
('residential-neighborhood', 'Residential Neighborhood', 'Housing area'),
('downtown', 'Downtown', 'City center'),
('suburb', 'Suburb', 'Residential outskirts'),
('waterfront', 'Waterfront', 'Water-adjacent area'),
('skyline', 'Skyline', 'City horizon view'),
('countryside', 'Countryside', 'Rural landscape'),
('wilderness', 'Wilderness', 'Untamed natural area');

-- Insert Foreground Elements
INSERT INTO public.foreground_elements (value, label, description) VALUES
('raindrops-on-window', 'Raindrops on Window', 'Water droplets on glass'),
('tree-branches', 'Tree Branches', 'Overhanging foliage'),
('lens-flare', 'Lens Flare', 'Light artifacts'),
('smoke', 'Smoke', 'Atmospheric smoke'),
('dust-particles', 'Dust Particles', 'Floating dust'),
('snowflakes', 'Snowflakes', 'Falling snow'),
('leaves', 'Leaves', 'Falling or floating leaves'),
('insects', 'Insects', 'Flying insects'),
('birds', 'Birds', 'Flying birds'),
('shadows', 'Shadows', 'Cast shadows'),
('reflections', 'Reflections', 'Surface reflections'),
('steam', 'Steam', 'Rising vapor'),
('fog', 'Fog', 'Atmospheric fog'),
('mist', 'Mist', 'Light atmospheric moisture'),
('haze', 'Haze', 'Atmospheric haze'),
('glare', 'Glare', 'Bright light reflection'),
('bloom', 'Bloom', 'Light bloom effect'),
('vignette', 'Vignette', 'Darkened edges'),
('grain', 'Grain', 'Film grain texture'),
('scratches', 'Scratches', 'Surface imperfections'),
('water-drops', 'Water Drops', 'Water droplets'),
('sparkles', 'Sparkles', 'Light sparkles'),
('bokeh-lights', 'Bokeh Lights', 'Out-of-focus light sources'),
('light-streaks', 'Light Streaks', 'Moving light trails'),
('particles', 'Particles', 'Floating particles'),
('texture-overlay', 'Texture Overlay', 'Surface texture'),
('color-fringe', 'Color Fringe', 'Chromatic aberration'),
('lens-distortion', 'Lens Distortion', 'Optical distortion'),
('focus-breathing', 'Focus Breathing', 'Focus shift effect'),
('motion-blur', 'Motion Blur', 'Movement blur');

-- Insert Subject Counts
INSERT INTO public.subject_counts (value, label, description) VALUES
('solo', 'Solo', 'Single subject'),
('pair', 'Pair', 'Two subjects'),
('small-group', 'Small Group', '3-5 subjects'),
('medium-group', 'Medium Group', '6-10 subjects'),
('large-group', 'Large Group', '11-20 subjects'),
('crowd', 'Crowd', 'Many subjects'),
('empty', 'Empty', 'No visible subjects'),
('multiple', 'Multiple', 'Several subjects'),
('duo', 'Duo', 'Two people'),
('ensemble', 'Ensemble', 'Group of people');

-- Insert Eye Contacts
INSERT INTO public.eye_contacts (value, label, description) VALUES
('direct-gaze', 'Direct Gaze', 'Looking directly at camera'),
('profile-view', 'Profile View', 'Side view of subject'),
('looking-away', 'Looking Away', 'Subject looking elsewhere'),
('looking-down', 'Looking Down', 'Subject looking down'),
('looking-up', 'Looking Up', 'Subject looking up'),
('looking-left', 'Looking Left', 'Subject looking left'),
('looking-right', 'Looking Right', 'Subject looking right'),
('eyes-closed', 'Eyes Closed', 'Subject''s eyes are closed'),
('partial-face', 'Partial Face', 'Only part of face visible'),
('back-of-head', 'Back of Head', 'Subject facing away');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_camera_angles_value ON public.camera_angles(value);
CREATE INDEX IF NOT EXISTS idx_lens_types_value ON public.lens_types(value);
CREATE INDEX IF NOT EXISTS idx_shot_sizes_value ON public.shot_sizes(value);
CREATE INDEX IF NOT EXISTS idx_depth_of_field_value ON public.depth_of_field(value);
CREATE INDEX IF NOT EXISTS idx_composition_techniques_value ON public.composition_techniques(value);
CREATE INDEX IF NOT EXISTS idx_lighting_styles_value ON public.lighting_styles(value);
CREATE INDEX IF NOT EXISTS idx_color_palettes_value ON public.color_palettes(value);
CREATE INDEX IF NOT EXISTS idx_era_emulations_value ON public.era_emulations(value);
CREATE INDEX IF NOT EXISTS idx_scene_moods_value ON public.scene_moods(value);
CREATE INDEX IF NOT EXISTS idx_camera_movements_value ON public.camera_movements(value);
CREATE INDEX IF NOT EXISTS idx_aspect_ratios_value ON public.aspect_ratios(value);
CREATE INDEX IF NOT EXISTS idx_time_settings_value ON public.time_settings(value);
CREATE INDEX IF NOT EXISTS idx_weather_conditions_value ON public.weather_conditions(value);
CREATE INDEX IF NOT EXISTS idx_location_types_value ON public.location_types(value);
CREATE INDEX IF NOT EXISTS idx_foreground_elements_value ON public.foreground_elements(value);
CREATE INDEX IF NOT EXISTS idx_subject_counts_value ON public.subject_counts(value);
CREATE INDEX IF NOT EXISTS idx_eye_contacts_value ON public.eye_contacts(value);

-- Enable RLS on all tables
ALTER TABLE public.camera_angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lens_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shot_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depth_of_field ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composition_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lighting_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.era_emulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aspect_ratios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foreground_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eye_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables (public read access)
CREATE POLICY "Anyone can view camera angles" ON public.camera_angles FOR SELECT USING (true);
CREATE POLICY "Anyone can view lens types" ON public.lens_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view shot sizes" ON public.shot_sizes FOR SELECT USING (true);
CREATE POLICY "Anyone can view depth of field" ON public.depth_of_field FOR SELECT USING (true);
CREATE POLICY "Anyone can view composition techniques" ON public.composition_techniques FOR SELECT USING (true);
CREATE POLICY "Anyone can view lighting styles" ON public.lighting_styles FOR SELECT USING (true);
CREATE POLICY "Anyone can view color palettes" ON public.color_palettes FOR SELECT USING (true);
CREATE POLICY "Anyone can view era emulations" ON public.era_emulations FOR SELECT USING (true);
CREATE POLICY "Anyone can view scene moods" ON public.scene_moods FOR SELECT USING (true);
CREATE POLICY "Anyone can view camera movements" ON public.camera_movements FOR SELECT USING (true);
CREATE POLICY "Anyone can view aspect ratios" ON public.aspect_ratios FOR SELECT USING (true);
CREATE POLICY "Anyone can view time settings" ON public.time_settings FOR SELECT USING (true);
CREATE POLICY "Anyone can view weather conditions" ON public.weather_conditions FOR SELECT USING (true);
CREATE POLICY "Anyone can view location types" ON public.location_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view foreground elements" ON public.foreground_elements FOR SELECT USING (true);
CREATE POLICY "Anyone can view subject counts" ON public.subject_counts FOR SELECT USING (true);
CREATE POLICY "Anyone can view eye contacts" ON public.eye_contacts FOR SELECT USING (true);

-- Add comments
COMMENT ON TABLE public.camera_angles IS 'Predefined camera angle options';
COMMENT ON TABLE public.lens_types IS 'Predefined lens type options';
COMMENT ON TABLE public.shot_sizes IS 'Predefined shot size options';
COMMENT ON TABLE public.depth_of_field IS 'Predefined depth of field options';
COMMENT ON TABLE public.composition_techniques IS 'Predefined composition technique options';
COMMENT ON TABLE public.lighting_styles IS 'Predefined lighting style options';
COMMENT ON TABLE public.color_palettes IS 'Predefined color palette options';
COMMENT ON TABLE public.era_emulations IS 'Predefined era emulation options';
COMMENT ON TABLE public.scene_moods IS 'Predefined scene mood options';
COMMENT ON TABLE public.camera_movements IS 'Predefined camera movement options';
COMMENT ON TABLE public.aspect_ratios IS 'Predefined aspect ratio options';
COMMENT ON TABLE public.time_settings IS 'Predefined time setting options';
COMMENT ON TABLE public.weather_conditions IS 'Predefined weather condition options';
COMMENT ON TABLE public.location_types IS 'Predefined location type options';
COMMENT ON TABLE public.foreground_elements IS 'Predefined foreground element options';
COMMENT ON TABLE public.subject_counts IS 'Predefined subject count options';
COMMENT ON TABLE public.eye_contacts IS 'Predefined eye contact options';
