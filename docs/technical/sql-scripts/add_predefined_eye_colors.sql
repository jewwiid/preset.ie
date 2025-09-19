-- Create predefined eye colors table
CREATE TABLE IF NOT EXISTS predefined_eye_colors (
  id SERIAL PRIMARY KEY,
  color_name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined eye colors
INSERT INTO predefined_eye_colors (color_name, sort_order) VALUES
-- Common Eye Colors
('Brown', 1),
('Blue', 2),
('Green', 3),
('Hazel', 4),
('Gray', 5),
('Amber', 6),

-- Less Common Eye Colors
('Heterochromia', 7),
('Violet', 8),
('Red', 9),

-- Other option for custom input
('Other', 10)

ON CONFLICT (color_name) DO NOTHING;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_predefined_eye_colors_active ON predefined_eye_colors(is_active);
CREATE INDEX IF NOT EXISTS idx_predefined_eye_colors_sort_order ON predefined_eye_colors(sort_order);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_predefined_eye_colors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_predefined_eye_colors_updated_at
  BEFORE UPDATE ON predefined_eye_colors
  FOR EACH ROW
  EXECUTE FUNCTION update_predefined_eye_colors_updated_at();
