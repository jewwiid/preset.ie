-- Add director_styles table
CREATE TABLE IF NOT EXISTS director_styles (
  id SERIAL PRIMARY KEY,
  value VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert director styles
INSERT INTO director_styles (value, label, description) VALUES
('wes-anderson', 'Wes Anderson', 'Symmetrical compositions, pastel colors, centered framing'),
('roger-deakins', 'Roger Deakins', 'Naturalistic lighting, epic landscapes, cinematic depth'),
('christopher-doyle', 'Christopher Doyle', 'Handheld camera work, neon colors, dynamic movement'),
('david-fincher', 'David Fincher', 'Desaturated colors, precise framing, dark atmospheres'),
('sofia-coppola', 'Sofia Coppola', 'Dreamy aesthetics, soft pastels, intimate framing'),
('stanley-kubrick', 'Stanley Kubrick', 'One-point perspective, symmetrical compositions, meticulous framing'),
('terrence-malick', 'Terrence Malick', 'Natural lighting, poetic imagery, organic movement'),
('denis-villeneuve', 'Denis Villeneuve', 'Minimalist compositions, muted colors, atmospheric depth'),
('christopher-nolan', 'Christopher Nolan', 'Complex narratives, practical effects, epic scale'),
('greta-gerwig', 'Greta Gerwig', 'Authentic performances, natural lighting, character-driven'),
('jordan-peele', 'Jordan Peele', 'Social commentary, suspenseful pacing, symbolic imagery'),
('alex-garland', 'Alex Garland', 'Sci-fi aesthetics, philosophical themes, atmospheric tension'),
('barry-jenkins', 'Barry Jenkins', 'Intimate storytelling, poetic cinematography, emotional depth'),
('chloe-zhao', 'Chloe Zhao', 'Naturalistic performances, wide landscapes, contemplative pacing'),
('taika-waititi', 'Taika Waititi', 'Quirky humor, vibrant colors, unconventional storytelling')
ON CONFLICT (value) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_director_styles_value ON director_styles(value);
CREATE INDEX IF NOT EXISTS idx_director_styles_active ON director_styles(is_active);
