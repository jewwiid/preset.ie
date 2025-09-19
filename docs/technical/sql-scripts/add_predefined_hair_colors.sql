-- Create predefined hair colors table
CREATE TABLE IF NOT EXISTS predefined_hair_colors (
  id SERIAL PRIMARY KEY,
  color_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined hair colors
INSERT INTO predefined_hair_colors (color_name, sort_order) VALUES
-- Natural Hair Colors
('Black', 1),
('Dark Brown', 2),
('Brown', 3),
('Light Brown', 4),
('Blonde', 5),
('Light Blonde', 6),
('Red', 7),
('Auburn', 8),
('Gray', 9),
('White', 10),

-- Dyed Hair Colors
('Blue', 11),
('Green', 12),
('Purple', 13),
('Pink', 14),
('Orange', 15),
('Silver', 16),
('Platinum', 17),

-- Other options
('Bald', 18),
('Other', 19)

ON CONFLICT (color_name) DO NOTHING;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_predefined_hair_colors_active ON predefined_hair_colors(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_hair_colors_sort_order ON predefined_hair_colors(sort_order);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_predefined_hair_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_predefined_hair_colors_updated_at
  BEFORE UPDATE ON predefined_hair_colors
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_hair_colors_updated_at();
