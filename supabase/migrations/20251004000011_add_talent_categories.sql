-- Add predefined talent categories table
-- This table stores talent/performer categories like Model, Actor, Dancer, Musician, etc.
-- Talent categories are used for primary_skill selection for users with TALENT role

CREATE TABLE IF NOT EXISTS predefined_talent_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_predefined_talent_categories_active ON predefined_talent_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_talent_categories_sort ON predefined_talent_categories(sort_order);

-- Enable RLS
ALTER TABLE predefined_talent_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "predefined_talent_categories_read_all" ON predefined_talent_categories;
DROP POLICY IF EXISTS "predefined_talent_categories_read_authenticated" ON predefined_talent_categories;

-- Anyone can read active talent categories
CREATE POLICY "predefined_talent_categories_read_all" ON predefined_talent_categories
  FOR SELECT USING (is_active = true);

-- Authenticated users can read all (including inactive)
CREATE POLICY "predefined_talent_categories_read_authenticated" ON predefined_talent_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add comment
COMMENT ON TABLE predefined_talent_categories IS 'Predefined talent/performer categories for users with TALENT role (e.g., Model, Actor, Dancer, Musician, Influencer). Used for primary_skill selection and talent_categories array.';

-- Insert initial talent categories
INSERT INTO predefined_talent_categories (category_name, description, sort_order) VALUES
('Model', 'Professional model for photography and video shoots', 1),
('Actor', 'Performer for video, film, and commercial content', 2),
('Actress', 'Female performer for video, film, and commercial content', 3),
('Dancer', 'Professional dancer and choreographer', 4),
('Musician', 'Musical performer and artist', 5),
('Singer', 'Vocal performer', 6),
('Voice Actor', 'Voice-over artist and narrator', 7),
('Influencer', 'Social media content creator and influencer', 8),
('Content Creator', 'Digital content creator across platforms', 9),
('Performer', 'General performance artist', 10),
('Stunt Performer', 'Professional stunt artist', 11),
('Extra/Background Actor', 'Background performer for productions', 12),
('Hand Model', 'Specialized hand modeling', 13),
('Fitness Model', 'Fitness and athletic modeling', 14),
('Commercial Model', 'Commercial and advertising modeling', 15),
('Fashion Model', 'Runway and fashion modeling', 16),
('Plus-Size Model', 'Plus-size fashion and commercial modeling', 17),
('Child Model', 'Child talent for productions', 18),
('Teen Model', 'Teenage talent for productions', 19),
('Mature Model', 'Mature/senior talent for productions', 20)
ON CONFLICT (category_name) DO NOTHING;

-- Grant permissions
GRANT SELECT ON predefined_talent_categories TO authenticated, anon;
