-- Create languages and specializations tables for Professional tab
-- This provides structured options for languages and specializations

-- Step 1: Create languages_master table
CREATE TABLE IF NOT EXISTS languages_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    native_name VARCHAR(100),
    iso_code VARCHAR(10),
    region VARCHAR(50),
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Add comments
COMMENT ON TABLE languages_master IS 'Master list of languages for user selection';
COMMENT ON COLUMN languages_master.name IS 'English name of the language';
COMMENT ON COLUMN languages_master.native_name IS 'Native name of the language';
COMMENT ON COLUMN languages_master.iso_code IS 'ISO 639-1 or 639-3 language code';
COMMENT ON COLUMN languages_master.region IS 'Geographic region where language is primarily spoken';
COMMENT ON COLUMN languages_master.is_popular IS 'Mark commonly spoken languages';

-- Step 3: Enable RLS
ALTER TABLE languages_master ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies for public read access
CREATE POLICY "Anyone can read active languages" ON languages_master
    FOR SELECT USING (is_active = true);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_languages_master_popular ON languages_master(is_popular);
CREATE INDEX IF NOT EXISTS idx_languages_master_active ON languages_master(is_active);
CREATE INDEX IF NOT EXISTS idx_languages_master_sort_order ON languages_master(sort_order);

-- Step 6: Insert common languages
INSERT INTO languages_master (name, native_name, iso_code, region, is_popular, sort_order) VALUES
-- Most popular languages
('English', 'English', 'en', 'Global', TRUE, 1),
('Spanish', 'Español', 'es', 'Spain/Latin America', TRUE, 2),
('French', 'Français', 'fr', 'France/Canada', TRUE, 3),
('German', 'Deutsch', 'de', 'Germany/Austria', TRUE, 4),
('Italian', 'Italiano', 'it', 'Italy', TRUE, 5),
('Portuguese', 'Português', 'pt', 'Brazil/Portugal', TRUE, 6),
('Chinese (Mandarin)', '中文', 'zh', 'China', TRUE, 7),
('Japanese', '日本語', 'ja', 'Japan', TRUE, 8),
('Korean', '한국어', 'ko', 'South Korea', TRUE, 9),
('Arabic', 'العربية', 'ar', 'Middle East', TRUE, 10),
('Russian', 'Русский', 'ru', 'Russia', TRUE, 11),
('Dutch', 'Nederlands', 'nl', 'Netherlands', TRUE, 12),
('Swedish', 'Svenska', 'sv', 'Sweden', TRUE, 13),
('Norwegian', 'Norsk', 'no', 'Norway', TRUE, 14),
('Danish', 'Dansk', 'da', 'Denmark', TRUE, 15),
('Finnish', 'Suomi', 'fi', 'Finland', TRUE, 16),
('Polish', 'Polski', 'pl', 'Poland', TRUE, 17),
('Czech', 'Čeština', 'cs', 'Czech Republic', TRUE, 18),
('Hungarian', 'Magyar', 'hu', 'Hungary', TRUE, 19),
('Greek', 'Ελληνικά', 'el', 'Greece', TRUE, 20),

-- Regional languages
('Hindi', 'हिन्दी', 'hi', 'India', TRUE, 21),
('Bengali', 'বাংলা', 'bn', 'Bangladesh/India', TRUE, 22),
('Urdu', 'اردو', 'ur', 'Pakistan', TRUE, 23),
('Turkish', 'Türkçe', 'tr', 'Turkey', TRUE, 24),
('Persian', 'فارسی', 'fa', 'Iran', TRUE, 25),
('Hebrew', 'עברית', 'he', 'Israel', TRUE, 26),
('Thai', 'ไทย', 'th', 'Thailand', TRUE, 27),
('Vietnamese', 'Tiếng Việt', 'vi', 'Vietnam', TRUE, 28),
('Indonesian', 'Bahasa Indonesia', 'id', 'Indonesia', TRUE, 29),
('Malay', 'Bahasa Melayu', 'ms', 'Malaysia', TRUE, 30),

-- African languages
('Swahili', 'Kiswahili', 'sw', 'East Africa', TRUE, 31),
('Amharic', 'አማርኛ', 'am', 'Ethiopia', TRUE, 32),
('Yoruba', 'Yorùbá', 'yo', 'Nigeria', TRUE, 33),
('Igbo', 'Igbo', 'ig', 'Nigeria', TRUE, 34),
('Hausa', 'Hausa', 'ha', 'Nigeria', TRUE, 35),

-- Other important languages
('Tagalog', 'Tagalog', 'tl', 'Philippines', TRUE, 36),
('Ukrainian', 'Українська', 'uk', 'Ukraine', TRUE, 37),
('Romanian', 'Română', 'ro', 'Romania', TRUE, 38),
('Bulgarian', 'Български', 'bg', 'Bulgaria', TRUE, 39),
('Croatian', 'Hrvatski', 'hr', 'Croatia', TRUE, 40),
('Serbian', 'Српски', 'sr', 'Serbia', TRUE, 41),
('Slovak', 'Slovenčina', 'sk', 'Slovakia', TRUE, 42),
('Slovenian', 'Slovenščina', 'sl', 'Slovenia', TRUE, 43),
('Lithuanian', 'Lietuvių', 'lt', 'Lithuania', TRUE, 44),
('Latvian', 'Latviešu', 'lv', 'Latvia', TRUE, 45),
('Estonian', 'Eesti', 'et', 'Estonia', TRUE, 46),

-- Sign languages
('American Sign Language', 'ASL', 'ase', 'United States', TRUE, 47),
('British Sign Language', 'BSL', 'bfi', 'United Kingdom', TRUE, 48);

-- Step 7: Create specializations table
CREATE TABLE IF NOT EXISTS specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 8: Add comments
COMMENT ON TABLE specializations IS 'Professional specializations for creative and technical roles';
COMMENT ON COLUMN specializations.name IS 'Name of the specialization';
COMMENT ON COLUMN specializations.category IS 'Category: photography, videography, post-production, technical, business';
COMMENT ON COLUMN specializations.description IS 'Description of the specialization';

-- Step 9: Enable RLS
ALTER TABLE specializations ENABLE ROW LEVEL SECURITY;

-- Step 10: Create policies for public read access
CREATE POLICY "Anyone can read active specializations" ON specializations
    FOR SELECT USING (is_active = true);

-- Step 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_specializations_category ON specializations(category);
CREATE INDEX IF NOT EXISTS idx_specializations_active ON specializations(is_active);
CREATE INDEX IF NOT EXISTS idx_specializations_sort_order ON specializations(sort_order);

-- Step 12: Insert specializations
INSERT INTO specializations (name, category, description, sort_order) VALUES
-- Photography specializations
('Portrait Photography', 'photography', 'Professional portrait photography', 1),
('Fashion Photography', 'photography', 'Fashion and editorial photography', 2),
('Wedding Photography', 'photography', 'Wedding and event photography', 3),
('Commercial Photography', 'photography', 'Commercial and advertising photography', 4),
('Product Photography', 'photography', 'Product and still life photography', 5),
('Architecture Photography', 'photography', 'Architectural and real estate photography', 6),
('Street Photography', 'photography', 'Documentary and street photography', 7),
('Sports Photography', 'photography', 'Sports and action photography', 8),
('Food Photography', 'photography', 'Food and culinary photography', 9),
('Travel Photography', 'photography', 'Travel and landscape photography', 10),
('Fine Art Photography', 'photography', 'Artistic and creative photography', 11),
('Documentary Photography', 'photography', 'Documentary and photojournalism', 12),
('Event Photography', 'photography', 'Corporate and social event photography', 13),
('Real Estate Photography', 'photography', 'Property and real estate photography', 14),
('Medical Photography', 'photography', 'Medical and scientific photography', 15),

-- Videography specializations
('Corporate Video', 'videography', 'Corporate and business video production', 16),
('Wedding Videography', 'videography', 'Wedding and event videography', 17),
('Documentary Filmmaking', 'videography', 'Documentary and non-fiction video', 18),
('Music Video Production', 'videography', 'Music video and performance recording', 19),
('Commercial Video', 'videography', 'Commercial and advertising video', 20),
('Social Media Content', 'videography', 'Social media and short-form content', 21),
('Live Streaming', 'videography', 'Live streaming and broadcast production', 22),
('Event Videography', 'videography', 'Event and conference videography', 23),
('Educational Video', 'videography', 'Educational and training video content', 24),
('Drone Videography', 'videography', 'Aerial and drone video production', 25),

-- Post-production specializations
('Video Editing', 'post-production', 'Video editing and post-production', 26),
('Color Grading', 'post-production', 'Color correction and grading', 27),
('Motion Graphics', 'post-production', 'Motion graphics and animation', 28),
('Visual Effects (VFX)', 'post-production', 'Visual effects and compositing', 29),
('Audio Post-Production', 'post-production', 'Audio editing and sound design', 30),
('3D Animation', 'post-production', '3D modeling and animation', 31),
('Title Design', 'post-production', 'Title and graphic design', 32),
('Video Compression', 'post-production', 'Video encoding and optimization', 33),

-- Technical specializations
('Camera Operation', 'technical', 'Professional camera operation', 34),
('Lighting Design', 'technical', 'Professional lighting setup and design', 35),
('Audio Engineering', 'technical', 'Audio recording and engineering', 36),
('Equipment Management', 'technical', 'Equipment setup and maintenance', 37),
('Studio Management', 'technical', 'Studio operations and management', 38),
('Drone Operation', 'technical', 'Drone piloting and aerial photography', 39),
('Stabilization Systems', 'technical', 'Gimbal and stabilization operation', 40),
('Live Production', 'technical', 'Live event and broadcast production', 41),

-- Business specializations
('Project Management', 'business', 'Creative project management', 42),
('Client Relations', 'business', 'Client communication and management', 43),
('Marketing Strategy', 'business', 'Creative marketing and branding', 44),
('Business Development', 'business', 'Business growth and development', 45),
('Team Leadership', 'business', 'Team management and leadership', 46),
('Budget Management', 'business', 'Financial planning and control', 47),
('Contract Negotiation', 'business', 'Business agreements and contracts', 48),
('Quality Assurance', 'business', 'Quality control and standards', 49);
