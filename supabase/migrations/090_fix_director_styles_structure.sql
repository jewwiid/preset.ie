-- Fix director_styles table structure to match other cinematic parameter tables
DROP TABLE IF EXISTS director_styles CASCADE;

-- Create director_styles table with correct structure
CREATE TABLE IF NOT EXISTS public.director_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  value VARCHAR(50) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) DEFAULT 'director',
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert director styles
INSERT INTO public.director_styles (value, label, description, usage_count) VALUES
('wes-anderson', 'Wes Anderson', 'Symmetrical compositions, pastel colors, centered framing', 0),
('roger-deakins', 'Roger Deakins', 'Naturalistic lighting, epic landscapes, cinematic depth', 0),
('christopher-doyle', 'Christopher Doyle', 'Handheld camera work, neon colors, dynamic movement', 0),
('david-fincher', 'David Fincher', 'Desaturated color palettes, precise compositions, psychological thrillers', 0),
('sofia-coppola', 'Sofia Coppola', 'Dreamy aesthetics, soft pastels, intimate character studies', 0),
('stanley-kubrick', 'Stanley Kubrick', 'One-point perspective, unsettling symmetry, wide-angle shots', 0),
('terrence-malick', 'Terrence Malick', 'Natural light, poetic visuals, philosophical themes', 0),
('denis-villeneuve', 'Denis Villeneuve', 'Minimalist design, muted color palettes, atmospheric sci-fi', 0),
('quentin-tarantino', 'Quentin Tarantino', 'Stylized violence, pop culture references, non-linear narratives', 0),
('greta-gerwig', 'Greta Gerwig', 'Authentic dialogue, vibrant colors, coming-of-age stories', 0),
('jordan-peele', 'Jordan Peele', 'Social commentary, psychological horror, unsettling atmosphere', 0),
('chloe-zhao', 'Chloé Zhao', 'Natural landscapes, intimate portraits, golden hour lighting', 0),
('guillermo-del-toro', 'Guillermo del Toro', 'Dark fantasy, intricate creature design, gothic aesthetics', 0),
('bong-joon-ho', 'Bong Joon-ho', 'Social satire, genre-bending, dark humor', 0),
('yorgos-lanthimos', 'Yorgos Lanthimos', 'Absurdist humor, deadpan delivery, surreal scenarios', 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_director_styles_value ON public.director_styles (value);
CREATE INDEX IF NOT EXISTS idx_director_styles_active ON public.director_styles (is_active);
CREATE INDEX IF NOT EXISTS idx_director_styles_usage_count ON public.director_styles (usage_count DESC);

-- Add RLS policy
ALTER TABLE public.director_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view director styles" ON public.director_styles
  FOR SELECT USING (true);

-- Add comment
COMMENT ON TABLE public.director_styles IS 'Director styles for cinematic parameter selection';
