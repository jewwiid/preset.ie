-- Create director_styles table (if not exists)
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

-- Insert Director Styles (with conflict handling)
INSERT INTO public.director_styles (value, label, description) VALUES
('wes-anderson', 'Wes Anderson', 'Symmetrical framing, pastel colors, meticulous design, centered compositions'),
('roger-deakins', 'Roger Deakins', 'Naturalistic lighting, epic landscapes, careful shadows, masterful use of light'),
('christopher-doyle', 'Christopher Doyle', 'Expressive handheld movement, saturated neon colors, dynamic cinematography'),
('sofia-coppola', 'Sofia Coppola', 'Soft, dreamy aesthetics with intimate character focus, muted tones'),
('david-fincher', 'David Fincher', 'Dark, precise cinematography with high contrast, meticulous framing'),
('denis-villeneuve', 'Denis Villeneuve', 'Epic scale with minimalist, atmospheric compositions, vast landscapes'),
('paul-thomas-anderson', 'Paul Thomas Anderson', 'Long takes, fluid camera movement, character-driven narratives'),
('terrence-malick', 'Terrence Malick', 'Natural light, poetic imagery, philosophical themes, nature-focused'),
('stanley-kubrick', 'Stanley Kubrick', 'Geometric compositions, symmetrical framing, bold colors, one-point perspective'),
('alfred-hitchcock', 'Alfred Hitchcock', 'Suspenseful framing, dramatic shadows, psychological tension, voyeuristic angles'),
('martin-scorsese', 'Martin Scorsese', 'Dynamic camera movement, urban settings, character-driven storytelling'),
('quentin-tarantino', 'Quentin Tarantino', 'Stylized violence, pop culture references, non-linear narratives'),
('coen-brothers', 'Coen Brothers', 'Dark humor, quirky characters, precise cinematography, regional settings'),
('spike-lee', 'Spike Lee', 'Urban realism, social commentary, bold visual style, New York settings'),
('ridley-scott', 'Ridley Scott', 'Epic scale, atmospheric lighting, detailed world-building'),
('christopher-nolan', 'Christopher Nolan', 'Complex narratives, practical effects, IMAX cinematography, time manipulation'),
('guillermo-del-toro', 'Guillermo Del Toro', 'Dark fantasy, gothic aesthetics, creature design, fairy tale elements'),
('darren-aronofsky', 'Darren Aronofsky', 'Psychological intensity, handheld camera, surreal imagery'),
('gaspar-noe', 'Gaspar Noé', 'Disturbing themes, long takes, disorienting camera work'),
('lars-von-trier', 'Lars Von Trier', 'Dogme 95 style, handheld camera, psychological drama'),
('jean-luc-godard', 'Jean-Luc Godard', 'French New Wave, jump cuts, political themes, experimental techniques'),
('ingmar-bergman', 'Ingmar Bergman', 'Psychological depth, stark cinematography, existential themes'),
('akira-kurosawa', 'Akira Kurosawa', 'Epic compositions, natural lighting, samurai themes, rain sequences'),
('federico-fellini', 'Federico Fellini', 'Surreal imagery, carnivalesque atmosphere, Italian neorealism'),
('michelangelo-antonioni', 'Michelangelo Antonioni', 'Alienation themes, long takes, minimalist compositions'),
('francois-truffaut', 'François Truffaut', 'French New Wave, personal storytelling, natural lighting'),
('louis-malle', 'Louis Malle', 'Intimate character studies, naturalistic cinematography'),
('robert-bresson', 'Robert Bresson', 'Minimalist style, ascetic compositions, spiritual themes'),
('jean-pierre-jeunet', 'Jean-Pierre Jeunet', 'Whimsical imagery, steampunk aesthetics, quirky characters'),
('pier-paolo-pasolini', 'Pier Paolo Pasolini', 'Social realism, controversial themes, neorealist style'),
('michael-haneke', 'Michael Haneke', 'Clinical precision, social critique, uncomfortable realism'),
('bela-tarr', 'Béla Tarr', 'Long takes, black and white cinematography, existential themes'),
('andrei-tarkovsky', 'Andrei Tarkovsky', 'Poetic cinema, spiritual themes, nature imagery, slow pacing'),
('david-lynch', 'David Lynch', 'Surreal imagery, dreamlike sequences, psychological horror'),
('tim-burton', 'Tim Burton', 'Gothic aesthetics, dark humor, fantastical elements, stop-motion'),
('jonathan-glager', 'Jonathan Glazer', 'Minimalist style, atmospheric tension, precise compositions'),
('yorgos-lanthimos', 'Yorgos Lanthimos', 'Absurdist humor, deadpan delivery, unusual framing'),
('bong-joon-ho', 'Bong Joon-ho', 'Social satire, genre mixing, South Korean cinema'),
('park-chan-wook', 'Park Chan-wook', 'Stylized violence, revenge themes, Korean cinema'),
('hirokazu-koreeda', 'Hirokazu Kore-eda', 'Family dramas, naturalistic style, Japanese cinema'),
('wong-kar-wai', 'Wong Kar-wai', 'Romantic melancholy, saturated colors, Hong Kong settings'),
('zhang-yimou', 'Zhang Yimou', 'Colorful cinematography, Chinese historical epics'),
('ang-lee', 'Ang Lee', 'Emotional depth, cross-cultural themes, technical innovation')
ON CONFLICT (value) DO NOTHING;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_director_styles_value ON public.director_styles(value);

-- Enable RLS
ALTER TABLE public.director_styles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for public read access
CREATE POLICY "Anyone can view director styles" ON public.director_styles FOR SELECT USING (true);

-- Add comment
COMMENT ON TABLE public.director_styles IS 'Predefined director style options';
