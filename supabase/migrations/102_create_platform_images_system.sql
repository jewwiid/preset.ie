-- Create platform images system for homepage and preset visual aids
-- This migration creates tables for storing platform-wide images like homepage backgrounds
-- and visual aids for predefined presets (cinematic parameters, etc.)

-- Create platform_images table for storing platform-wide images
CREATE TABLE IF NOT EXISTS platform_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Image identification
    image_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'homepage_hero', 'cinematic_portrait_example'
    image_type VARCHAR(50) NOT NULL, -- 'homepage', 'preset_visual_aid', 'category_icon'
    category VARCHAR(100), -- 'cinematic_parameters', 'photography_styles', etc.
    
    -- Image data
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    alt_text TEXT,
    title VARCHAR(255),
    description TEXT,
    
    -- Image metadata
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    file_size INTEGER DEFAULT 0,
    format VARCHAR(10) DEFAULT 'jpg',
    
    -- Usage metadata
    usage_context JSONB DEFAULT '{}', -- Additional context for how this image should be used
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_image_type CHECK (image_type IN ('homepage', 'preset_visual_aid', 'category_icon', 'marketing', 'feature_showcase'))
);

-- Create preset_visual_aids table for linking images to specific presets
CREATE TABLE IF NOT EXISTS preset_visual_aids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preset_key VARCHAR(100) NOT NULL, -- e.g., 'cinematic_portrait', 'fashion_editorial'
    platform_image_id UUID NOT NULL REFERENCES platform_images(id) ON DELETE CASCADE,
    
    -- Visual aid specific metadata
    visual_aid_type VARCHAR(50) NOT NULL, -- 'example_result', 'style_reference', 'before_after', 'inspiration'
    display_title VARCHAR(255),
    display_description TEXT,
    is_primary BOOLEAN DEFAULT false, -- Primary visual aid for this preset
    display_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_visual_aid_type CHECK (visual_aid_type IN ('example_result', 'style_reference', 'before_after', 'inspiration', 'parameter_demo'))
);

-- Create browser_cache_config table for managing browser storage
CREATE TABLE IF NOT EXISTS browser_cache_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Cache configuration
    cache_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'homepage_images', 'preset_visual_aids'
    cache_strategy VARCHAR(50) NOT NULL, -- 'aggressive', 'moderate', 'conservative'
    cache_duration_hours INTEGER DEFAULT 24,
    
    -- Cache metadata
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    cache_version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    
    -- Cache statistics
    hit_count INTEGER DEFAULT 0,
    miss_count INTEGER DEFAULT 0,
    last_hit TIMESTAMPTZ,
    last_miss TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_cache_strategy CHECK (cache_strategy IN ('aggressive', 'moderate', 'conservative'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_images_key ON platform_images(image_key);
CREATE INDEX IF NOT EXISTS idx_platform_images_type ON platform_images(image_type);
CREATE INDEX IF NOT EXISTS idx_platform_images_category ON platform_images(category);
CREATE INDEX IF NOT EXISTS idx_platform_images_active ON platform_images(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_images_display_order ON platform_images(display_order);

CREATE INDEX IF NOT EXISTS idx_preset_visual_aids_preset_key ON preset_visual_aids(preset_key);
CREATE INDEX IF NOT EXISTS idx_preset_visual_aids_platform_image_id ON preset_visual_aids(platform_image_id);
CREATE INDEX IF NOT EXISTS idx_preset_visual_aids_type ON preset_visual_aids(visual_aid_type);
CREATE INDEX IF NOT EXISTS idx_preset_visual_aids_primary ON preset_visual_aids(is_primary);

CREATE INDEX IF NOT EXISTS idx_browser_cache_config_key ON browser_cache_config(cache_key);
CREATE INDEX IF NOT EXISTS idx_browser_cache_config_active ON browser_cache_config(is_active);

-- Enable RLS
ALTER TABLE platform_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE preset_visual_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_cache_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform_images (admin only)
-- Use service role for admin access since we don't know the exact user table structure
CREATE POLICY "Service role can manage platform images" ON platform_images
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for preset_visual_aids (admin only)
CREATE POLICY "Service role can manage preset visual aids" ON preset_visual_aids
    FOR ALL USING (auth.role() = 'service_role');

-- Create RLS policies for browser_cache_config (admin only)
CREATE POLICY "Service role can manage browser cache config" ON browser_cache_config
    FOR ALL USING (auth.role() = 'service_role');

-- Create public read policy for platform_images (users can view)
CREATE POLICY "Public can view active platform images" ON platform_images
    FOR SELECT USING (is_active = true);

-- Create public read policy for preset_visual_aids (users can view)
CREATE POLICY "Public can view preset visual aids" ON preset_visual_aids
    FOR SELECT USING (true);

-- Insert default browser cache configurations
INSERT INTO browser_cache_config (cache_key, cache_strategy, cache_duration_hours, cache_version) VALUES
('homepage_images', 'aggressive', 168, '1.0'), -- Cache homepage images for 1 week
('preset_visual_aids', 'moderate', 72, '1.0'), -- Cache preset visual aids for 3 days
('category_icons', 'aggressive', 720, '1.0'), -- Cache category icons for 1 month
('marketing_images', 'moderate', 168, '1.0'); -- Cache marketing images for 1 week

-- Insert default platform images for cinematic parameters
-- These will serve as visual aids for the predefined presets
INSERT INTO platform_images (image_key, image_type, category, image_url, alt_text, title, description, usage_context, display_order) VALUES
-- Cinematic Parameter Examples
('cinematic_portrait_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-portrait.jpg', 'Cinematic portrait example', 'Portrait', 'Example of cinematic portrait style', '{"preset_key": "portrait", "parameter_demo": true}', 1),
('cinematic_landscape_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-landscape.jpg', 'Cinematic landscape example', 'Landscape', 'Example of cinematic landscape style', '{"preset_key": "landscape", "parameter_demo": true}', 2),
('cinematic_cinematic_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-cinematic.jpg', 'Cinematic style example', 'Cinematic', 'Example of cinematic movie-like style', '{"preset_key": "cinematic", "parameter_demo": true}', 3),
('cinematic_fashion_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-fashion.jpg', 'Cinematic fashion example', 'Fashion', 'Example of cinematic fashion photography', '{"preset_key": "fashion", "parameter_demo": true}', 4),
('cinematic_street_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-street.jpg', 'Cinematic street example', 'Street', 'Example of cinematic street photography', '{"preset_key": "street", "parameter_demo": true}', 5),
('cinematic_commercial_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-commercial.jpg', 'Cinematic commercial example', 'Commercial', 'Example of cinematic commercial photography', '{"preset_key": "commercial", "parameter_demo": true}', 6),
('cinematic_artistic_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-artistic.jpg', 'Cinematic artistic example', 'Artistic', 'Example of cinematic artistic photography', '{"preset_key": "artistic", "parameter_demo": true}', 7),
('cinematic_documentary_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-documentary.jpg', 'Cinematic documentary example', 'Documentary', 'Example of cinematic documentary style', '{"preset_key": "documentary", "parameter_demo": true}', 8),
('cinematic_nature_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-nature.jpg', 'Cinematic nature example', 'Nature', 'Example of cinematic nature photography', '{"preset_key": "nature", "parameter_demo": true}', 9),
('cinematic_urban_example', 'preset_visual_aid', 'cinematic_parameters', '/images/preset-examples/cinematic-urban.jpg', 'Cinematic urban example', 'Urban', 'Example of cinematic urban photography', '{"preset_key": "urban", "parameter_demo": true}', 10),

-- Homepage Images
('homepage_hero_bg', 'homepage', 'hero', '/hero-bg.jpeg', 'Creative photography background', 'Hero Background', 'Main homepage background image', '{"section": "hero", "responsive": true}', 1),
('homepage_feature_1', 'homepage', 'features', '/images/homepage/feature-gigs.jpg', 'Gig posting and browsing', 'Post & Browse Gigs', 'Feature showcase for gig functionality', '{"section": "features", "feature_index": 1}', 2),
('homepage_feature_2', 'homepage', 'features', '/images/homepage/feature-showcases.jpg', 'Portfolio showcases', 'In-App Showcases', 'Feature showcase for portfolio functionality', '{"section": "features", "feature_index": 2}', 3),
('homepage_feature_3', 'homepage', 'features', '/images/homepage/feature-safety.jpg', 'Safe and trusted platform', 'Safe & Trusted', 'Feature showcase for safety features', '{"section": "features", "feature_index": 3}', 4);

-- Link preset visual aids to platform images
INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'portrait',
    pi.id,
    'parameter_demo',
    'Portrait Style Example',
    'See how the Portrait preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_portrait_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'landscape',
    pi.id,
    'parameter_demo',
    'Landscape Style Example',
    'See how the Landscape preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_landscape_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'cinematic',
    pi.id,
    'parameter_demo',
    'Cinematic Style Example',
    'See how the Cinematic preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_cinematic_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'fashion',
    pi.id,
    'parameter_demo',
    'Fashion Style Example',
    'See how the Fashion preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_fashion_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'street',
    pi.id,
    'parameter_demo',
    'Street Style Example',
    'See how the Street preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_street_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'commercial',
    pi.id,
    'parameter_demo',
    'Commercial Style Example',
    'See how the Commercial preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_commercial_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'artistic',
    pi.id,
    'parameter_demo',
    'Artistic Style Example',
    'See how the Artistic preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_artistic_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'documentary',
    pi.id,
    'parameter_demo',
    'Documentary Style Example',
    'See how the Documentary preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_documentary_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'nature',
    pi.id,
    'parameter_demo',
    'Nature Style Example',
    'See how the Nature preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_nature_example';

INSERT INTO preset_visual_aids (preset_key, platform_image_id, visual_aid_type, display_title, display_description, is_primary, display_order) 
SELECT 
    'urban',
    pi.id,
    'parameter_demo',
    'Urban Style Example',
    'See how the Urban preset transforms your images',
    true,
    1
FROM platform_images pi 
WHERE pi.image_key = 'cinematic_urban_example';

-- Add comments for documentation
COMMENT ON TABLE platform_images IS 'Stores platform-wide images like homepage backgrounds and preset visual aids';
COMMENT ON TABLE preset_visual_aids IS 'Links platform images to specific presets for visual guidance';
COMMENT ON TABLE browser_cache_config IS 'Configuration for browser-side caching of platform images';

COMMENT ON COLUMN platform_images.image_key IS 'Unique identifier for the image (e.g., homepage_hero, cinematic_portrait_example)';
COMMENT ON COLUMN platform_images.image_type IS 'Type of platform image: homepage, preset_visual_aid, category_icon, etc.';
COMMENT ON COLUMN platform_images.usage_context IS 'JSON metadata about how this image should be used and displayed';
COMMENT ON COLUMN platform_images.is_active IS 'Whether this image is currently active and should be displayed';

COMMENT ON COLUMN preset_visual_aids.preset_key IS 'Key identifying the preset this visual aid belongs to';
COMMENT ON COLUMN preset_visual_aids.visual_aid_type IS 'Type of visual aid: example_result, style_reference, before_after, etc.';
COMMENT ON COLUMN preset_visual_aids.is_primary IS 'Whether this is the primary visual aid for the preset';

COMMENT ON COLUMN browser_cache_config.cache_strategy IS 'Caching strategy: aggressive (long cache), moderate (medium cache), conservative (short cache)';
COMMENT ON COLUMN browser_cache_config.cache_duration_hours IS 'How long to cache this type of content in the browser (in hours)';
