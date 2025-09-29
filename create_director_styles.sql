-- Create director_styles table
CREATE TABLE IF NOT EXISTS director_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'director',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_director_styles_category ON director_styles(category);
CREATE INDEX IF NOT EXISTS idx_director_styles_active ON director_styles(is_active);

-- Insert director styles data
INSERT INTO director_styles (value, label, description, category) VALUES
('wes-anderson', 'Wes Anderson', 'Symmetrical framing, pastel colors, meticulous design', 'director'),
('roger-deakins', 'Roger Deakins', 'Naturalistic lighting, epic landscapes, careful shadows', 'director'),
('christopher-doyle', 'Christopher Doyle', 'Expressive handheld movement, saturated neon colors', 'director'),
('sofia-coppola', 'Sofia Coppola', 'Soft, dreamy aesthetics with intimate character focus', 'director'),
('david-fincher', 'David Fincher', 'Dark, precise cinematography with high contrast', 'director'),
('denis-villeneuve', 'Denis Villeneuve', 'Epic scale with minimalist, atmospheric compositions', 'director'),
('paul-thomas-anderson', 'Paul Thomas Anderson', 'Long takes, fluid camera movement, character-driven', 'director'),
('terrence-malick', 'Terrence Malick', 'Natural light, poetic imagery, philosophical themes', 'director'),
('stanley-kubrick', 'Stanley Kubrick', 'Geometric compositions, symmetrical framing, bold colors', 'director'),
('alfred-hitchcock', 'Alfred Hitchcock', 'Suspenseful framing, dramatic shadows, psychological tension', 'director');

-- Enable RLS
ALTER TABLE director_styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Allow public read access to director_styles" ON director_styles
FOR SELECT USING (is_active = true);
