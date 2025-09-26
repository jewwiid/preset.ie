-- Equipment Request Purposes System
-- This adds a purpose categorization system for equipment requests

-- ==============================================
-- EQUIPMENT REQUEST PURPOSES TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS equipment_request_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'wedding', 'corporate_event', 'portrait_session'
  display_name TEXT NOT NULL, -- e.g., 'Wedding Photography', 'Corporate Event', 'Portrait Session'
  description TEXT, -- Brief description of the purpose
  icon TEXT, -- Icon name for UI display (e.g., 'heart', 'briefcase', 'camera')
  category TEXT, -- Grouping category (e.g., 'photography', 'video', 'event')
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================
-- INSERT PREDEFINED PURPOSES
-- ==============================================

INSERT INTO equipment_request_purposes (name, display_name, description, icon, category, sort_order) VALUES
-- Photography Purposes
('wedding', 'Wedding Photography', 'Wedding ceremonies and receptions', 'heart', 'photography', 1),
('portrait', 'Portrait Session', 'Individual or group portrait photography', 'user', 'photography', 2),
('family', 'Family Photography', 'Family portraits and gatherings', 'users', 'photography', 3),
('maternity', 'Maternity Photography', 'Pregnancy and newborn photography', 'baby', 'photography', 4),
('engagement', 'Engagement Photography', 'Engagement and couple sessions', 'ring', 'photography', 5),
('senior', 'Senior Portrait', 'High school senior portraits', 'graduation-cap', 'photography', 6),
('headshot', 'Headshot Photography', 'Professional headshots and business portraits', 'user-check', 'photography', 7),
('real_estate', 'Real Estate Photography', 'Property and architectural photography', 'home', 'photography', 8),
('product', 'Product Photography', 'Commercial product photography', 'package', 'photography', 9),
('fashion', 'Fashion Photography', 'Fashion shoots and modeling', 'shirt', 'photography', 10),
('street', 'Street Photography', 'Urban and street photography', 'map-pin', 'photography', 11),
('landscape', 'Landscape Photography', 'Nature and landscape photography', 'mountain', 'photography', 12),
('wildlife', 'Wildlife Photography', 'Animal and nature photography', 'tree-pine', 'photography', 13),
('sports', 'Sports Photography', 'Sports events and action photography', 'trophy', 'photography', 14),
('event', 'Event Photography', 'Corporate events, parties, and gatherings', 'calendar', 'photography', 15),
('boudoir', 'Boudoir Photography', 'Intimate and artistic photography', 'heart', 'photography', 16),
('newborn', 'Newborn Photography', 'Newborn and baby photography sessions', 'baby', 'photography', 17),
('pet', 'Pet Photography', 'Pet and animal photography', 'dog', 'photography', 18),
('food', 'Food Photography', 'Culinary and restaurant photography', 'utensils', 'photography', 19),
('travel', 'Travel Photography', 'Travel and destination photography', 'map', 'photography', 20),
('macro', 'Macro Photography', 'Close-up and detailed photography', 'search', 'photography', 21),
('night', 'Night Photography', 'Low-light and night photography', 'moon', 'photography', 22),
('underwater', 'Underwater Photography', 'Underwater and aquatic photography', 'waves', 'photography', 23),
('aerial', 'Aerial Photography', 'Drone and aerial photography', 'plane', 'photography', 24),
('architectural', 'Architectural Photography', 'Building and structure photography', 'building', 'photography', 25),

-- Video Purposes
('wedding_video', 'Wedding Videography', 'Wedding ceremony and reception video', 'video', 'video', 26),
('corporate_video', 'Corporate Video', 'Business and corporate video production', 'briefcase', 'video', 27),
('documentary', 'Documentary Filming', 'Documentary and journalistic video', 'film', 'video', 28),
('music_video', 'Music Video', 'Music video production', 'music', 'video', 29),
('commercial', 'Commercial Video', 'Commercial and advertising video', 'tv', 'video', 30),
('live_stream', 'Live Streaming', 'Live event streaming and broadcasting', 'radio', 'video', 31),
('interview', 'Interview Recording', 'Professional interview recording', 'mic', 'video', 32),
('tutorial', 'Tutorial Video', 'Educational and tutorial content', 'book-open', 'video', 33),
('social_media', 'Social Media Content', 'Content for social media platforms', 'share-2', 'video', 34),
('youtube', 'YouTube Content', 'YouTube channel content creation', 'play', 'video', 35),
('tiktok', 'TikTok Content', 'TikTok and short-form video content', 'smartphone', 'video', 36),
('instagram', 'Instagram Content', 'Instagram stories and posts', 'instagram', 'video', 37),
('webinar', 'Webinar Recording', 'Online webinar and presentation recording', 'monitor', 'video', 38),
('training', 'Training Video', 'Educational and training video content', 'book', 'video', 39),
('promotional', 'Promotional Video', 'Marketing and promotional content', 'megaphone', 'video', 40),
('testimonial', 'Testimonial Video', 'Customer testimonial and review videos', 'star', 'video', 41),
('behind_scenes', 'Behind the Scenes', 'Behind-the-scenes and BTS content', 'camera', 'video', 42),
('time_lapse', 'Time-lapse Video', 'Time-lapse and slow-motion video', 'clock', 'video', 43),
('360_video', '360° Video', '360-degree and immersive video', 'globe', 'video', 44),
('vr_content', 'VR Content', 'Virtual reality and immersive content', 'vr', 'video', 45),

-- Audio Purposes
('podcast', 'Podcast Recording', 'Podcast production and recording', 'headphones', 'audio', 46),
('music_recording', 'Music Recording', 'Music production and recording', 'music', 'audio', 47),
('voice_over', 'Voice Over Recording', 'Voice over and narration recording', 'mic', 'audio', 48),
('live_sound', 'Live Sound', 'Live event sound reinforcement', 'speaker', 'audio', 49),
('studio_recording', 'Studio Recording', 'Professional studio recording', 'mic-2', 'audio', 50),
('audiobook', 'Audiobook Recording', 'Audiobook narration and production', 'book', 'audio', 51),
('radio', 'Radio Production', 'Radio show and broadcast production', 'radio', 'audio', 52),
('sound_design', 'Sound Design', 'Sound effects and audio design', 'volume-2', 'audio', 53),
('foley', 'Foley Recording', 'Foley and sound effect recording', 'zap', 'audio', 54),
('live_performance', 'Live Performance', 'Live music and performance recording', 'music', 'audio', 55),
('conference_call', 'Conference Call', 'Business conference and meeting recording', 'phone', 'audio', 56),
('language_learning', 'Language Learning', 'Language learning and education content', 'globe', 'audio', 57),

-- Event Purposes
('corporate_event', 'Corporate Event', 'Business meetings, conferences, and corporate events', 'briefcase', 'event', 58),
('birthday_party', 'Birthday Party', 'Birthday celebrations and parties', 'cake', 'event', 59),
('anniversary', 'Anniversary Celebration', 'Anniversary parties and celebrations', 'heart', 'event', 60),
('graduation', 'Graduation Ceremony', 'Graduation ceremonies and celebrations', 'graduation-cap', 'event', 61),
('baby_shower', 'Baby Shower', 'Baby shower celebrations', 'baby', 'event', 62),
('bridal_shower', 'Bridal Shower', 'Bridal shower celebrations', 'gift', 'event', 63),
('holiday_party', 'Holiday Party', 'Holiday celebrations and parties', 'tree-pine', 'event', 64),
('charity_event', 'Charity Event', 'Fundraising and charity events', 'hand-heart', 'event', 65),
('conference', 'Conference', 'Professional conferences and seminars', 'users', 'event', 66),
('workshop', 'Workshop', 'Educational workshops and training', 'book-open', 'event', 67),
('trade_show', 'Trade Show', 'Trade shows and exhibitions', 'store', 'event', 68),
('gala', 'Gala Event', 'Formal gala and black-tie events', 'crown', 'event', 69),
('festival', 'Festival', 'Music and cultural festivals', 'music', 'event', 70),
('award_ceremony', 'Award Ceremony', 'Awards and recognition ceremonies', 'trophy', 'event', 71),
('product_launch', 'Product Launch', 'Product launches and unveilings', 'rocket', 'event', 72),
('networking', 'Networking Event', 'Professional networking events', 'users', 'event', 73),
('retreat', 'Corporate Retreat', 'Corporate retreats and team building', 'mountain', 'event', 74),
('exhibition', 'Exhibition', 'Art and cultural exhibitions', 'palette', 'event', 75),
('sports_event', 'Sports Event', 'Sports competitions and events', 'trophy', 'event', 76),
('religious', 'Religious Event', 'Religious ceremonies and services', 'church', 'event', 77),

-- Creative Purposes
('art_project', 'Art Project', 'Artistic and creative projects', 'palette', 'creative', 78),
('short_film', 'Short Film', 'Short film production', 'film', 'creative', 79),
('student_project', 'Student Project', 'Academic and student projects', 'book', 'creative', 80),
('personal_project', 'Personal Project', 'Personal creative endeavors', 'user', 'creative', 81),
('portfolio', 'Portfolio Work', 'Portfolio development and showcase', 'folder', 'creative', 82),
('art_installation', 'Art Installation', 'Art installations and exhibitions', 'palette', 'creative', 83),
('experimental', 'Experimental Project', 'Experimental and avant-garde work', 'flask', 'creative', 84),
('collaboration', 'Collaborative Project', 'Collaborative creative projects', 'users', 'creative', 85),
('residency', 'Artist Residency', 'Artist residency and creative programs', 'home', 'creative', 86),
('grant_project', 'Grant Project', 'Grant-funded creative projects', 'award', 'creative', 87),
('thesis', 'Thesis Project', 'Academic thesis and research projects', 'book-open', 'creative', 88),
('competition', 'Competition Entry', 'Creative competition submissions', 'trophy', 'creative', 89),

-- Business Purposes
('marketing', 'Marketing Campaign', 'Marketing and advertising campaigns', 'megaphone', 'business', 90),
('branding', 'Brand Photography', 'Brand identity and branding content', 'tag', 'business', 91),
('website', 'Website Content', 'Website photography and content', 'monitor', 'business', 92),
('catalog', 'Product Catalog', 'Product catalog and brochure photography', 'book', 'business', 93),
('social_media_marketing', 'Social Media Marketing', 'Social media marketing content', 'share-2', 'business', 94),
('email_campaign', 'Email Campaign', 'Email marketing and newsletter content', 'mail', 'business', 95),
('press_release', 'Press Release', 'Press and media content', 'newspaper', 'business', 96),
('annual_report', 'Annual Report', 'Corporate annual report photography', 'file-text', 'business', 97),
('recruitment', 'Recruitment Content', 'HR and recruitment photography', 'users', 'business', 98),
('office_tour', 'Office Tour', 'Office and facility photography', 'building', 'business', 99),
('team_photo', 'Team Photography', 'Corporate team and staff photography', 'users', 'business', 100),

-- Other Purposes
('testing', 'Equipment Testing', 'Testing and evaluation of equipment', 'test-tube', 'other', 101),
('backup', 'Backup Equipment', 'Backup equipment for existing gear', 'shield', 'other', 102),
('emergency', 'Emergency Use', 'Emergency or urgent equipment needs', 'alert-triangle', 'other', 103),
('rental_business', 'Rental Business', 'Equipment rental business operations', 'store', 'other', 104),
('repair', 'Equipment Repair', 'Equipment repair and maintenance', 'wrench', 'other', 105),
('insurance', 'Insurance Claim', 'Insurance documentation and claims', 'shield-check', 'other', 106),
('legal', 'Legal Documentation', 'Legal documentation and evidence', 'scale', 'other', 107),
('research', 'Research Project', 'Academic and scientific research', 'microscope', 'other', 108),
('inventory', 'Inventory Documentation', 'Equipment inventory and cataloging', 'list', 'other', 109),
('custom', 'Custom Purpose', 'Custom purpose - specify in description', 'edit', 'other', 110),
('other', 'Other Purpose', 'Other specific purposes not listed', 'more-horizontal', 'other', 111);

-- ==============================================
-- ADD PURPOSE_ID TO EQUIPMENT_REQUESTS TABLE
-- ==============================================

-- Add purpose_id column to equipment_requests table
ALTER TABLE equipment_requests 
ADD COLUMN IF NOT EXISTS purpose_id UUID REFERENCES equipment_request_purposes(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_equipment_requests_purpose_id ON equipment_requests(purpose_id);

-- ==============================================
-- UPDATE EQUIPMENT_REQUESTS_WITH_RATINGS VIEW
-- ==============================================

-- Drop the existing view
DROP VIEW IF EXISTS equipment_requests_with_ratings;

-- Recreate the view with purpose information
CREATE OR REPLACE VIEW equipment_requests_with_ratings AS
SELECT 
  er.*,
  up.id as requester_profile_id,
  up.display_name as requester_display_name,
  up.handle as requester_handle,
  up.avatar_url as requester_avatar_url,
  up.verified_id as requester_verified_id,
  COALESCE(
    (SELECT AVG(rating)::DECIMAL(3,2) 
     FROM marketplace_reviews 
     WHERE subject_user_id = up.id), 
    0.0
  ) as requester_average_rating,
  COALESCE(
    (SELECT COUNT(*)::INTEGER 
     FROM marketplace_reviews 
     WHERE subject_user_id = up.id), 
    0
  ) as requester_review_count,
  -- Purpose information
  erp.name as purpose_name,
  erp.display_name as purpose_display_name,
  erp.description as purpose_description,
  erp.icon as purpose_icon,
  erp.category as purpose_category
FROM equipment_requests er
LEFT JOIN users_profile up ON er.requester_id = up.id
LEFT JOIN equipment_request_purposes erp ON er.purpose_id = erp.id;

-- ==============================================
-- PERMISSIONS
-- ==============================================

-- Grant permissions
GRANT SELECT ON equipment_request_purposes TO anon;
GRANT SELECT ON equipment_request_purposes TO authenticated;
GRANT SELECT ON equipment_request_purposes TO service_role;

GRANT SELECT ON equipment_requests_with_ratings TO anon;
GRANT SELECT ON equipment_requests_with_ratings TO authenticated;
GRANT SELECT ON equipment_requests_with_ratings TO service_role;

-- ==============================================
-- CUSTOM PURPOSE VALIDATION FUNCTIONS
-- ==============================================

-- Function to validate and create custom purposes
CREATE OR REPLACE FUNCTION validate_and_create_custom_purpose(
  p_custom_name TEXT,
  p_custom_display_name TEXT DEFAULT NULL,
  p_custom_description TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  purpose_id UUID;
  sanitized_name TEXT;
  sanitized_display_name TEXT;
BEGIN
  -- Sanitize input
  sanitized_name := LOWER(TRIM(p_custom_name));
  sanitized_display_name := COALESCE(TRIM(p_custom_display_name), INITCAP(sanitized_name));
  
  -- Validate input
  IF sanitized_name IS NULL OR LENGTH(sanitized_name) < 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purpose name must be at least 2 characters long'
    );
  END IF;
  
  IF LENGTH(sanitized_name) > 50 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purpose name must be 50 characters or less'
    );
  END IF;
  
  -- Check if purpose already exists (case insensitive)
  SELECT id INTO purpose_id
  FROM equipment_request_purposes
  WHERE LOWER(name) = sanitized_name
  OR LOWER(display_name) = LOWER(sanitized_display_name);
  
  IF purpose_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'exists', true,
      'purpose_id', purpose_id,
      'message', 'Purpose already exists'
    );
  END IF;
  
  -- Create new custom purpose
  INSERT INTO equipment_request_purposes (
    name,
    display_name,
    description,
    icon,
    category,
    is_active,
    sort_order
  ) VALUES (
    sanitized_name,
    sanitized_display_name,
    COALESCE(p_custom_description, 'Custom purpose: ' || sanitized_display_name),
    'edit',
    'custom',
    true,
    999 -- Custom purposes appear last
  ) RETURNING id INTO purpose_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'exists', false,
    'purpose_id', purpose_id,
    'message', 'Custom purpose created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to create custom purpose: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql;

-- Function to search purposes with fuzzy matching
CREATE OR REPLACE FUNCTION search_purposes(
  p_search_term TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  display_name TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  sort_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    erp.id,
    erp.name,
    erp.display_name,
    erp.description,
    erp.icon,
    erp.category,
    erp.sort_order
  FROM equipment_request_purposes erp
  WHERE erp.is_active = TRUE
  AND (p_category IS NULL OR erp.category = p_category)
  AND (
    p_search_term IS NULL 
    OR erp.name ILIKE '%' || p_search_term || '%'
    OR erp.display_name ILIKE '%' || p_search_term || '%'
    OR erp.description ILIKE '%' || p_search_term || '%'
  )
  ORDER BY 
    CASE WHEN p_search_term IS NOT NULL THEN
      CASE 
        WHEN erp.name ILIKE p_search_term || '%' THEN 1
        WHEN erp.display_name ILIKE p_search_term || '%' THEN 2
        WHEN erp.name ILIKE '%' || p_search_term || '%' THEN 3
        WHEN erp.display_name ILIKE '%' || p_search_term || '%' THEN 4
        ELSE 5
      END
    ELSE erp.sort_order END,
    erp.display_name
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE equipment_request_purposes IS 'Predefined purposes for equipment requests to help categorize and filter requests';
COMMENT ON COLUMN equipment_request_purposes.name IS 'Unique identifier for the purpose (e.g., wedding, portrait)';
COMMENT ON COLUMN equipment_request_purposes.display_name IS 'Human-readable name for UI display';
COMMENT ON COLUMN equipment_request_purposes.icon IS 'Icon name for UI display';
COMMENT ON COLUMN equipment_request_purposes.category IS 'Grouping category for organization';
COMMENT ON FUNCTION validate_and_create_custom_purpose IS 'Validates and creates custom purposes with duplicate checking';
COMMENT ON FUNCTION search_purposes IS 'Searches purposes with fuzzy matching and category filtering';

-- ==============================================
-- TEST QUERIES
-- ==============================================

-- Test the purposes table
SELECT 'Equipment request purposes created successfully!' as status;

-- Show all purposes grouped by category
SELECT 
  category,
  COUNT(*) as purpose_count,
  STRING_AGG(display_name, ', ' ORDER BY sort_order) as purposes
FROM equipment_request_purposes 
WHERE is_active = TRUE 
GROUP BY category 
ORDER BY category;
