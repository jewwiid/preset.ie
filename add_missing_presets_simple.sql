-- Simple version: Add missing presets with correct categories
-- Run fix_category_constraint.sql first, then this script

-- Add missing instant film presets
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Polaroid Originals Classic', 
       'Classic Polaroid instant film with iconic white border, warm tones, and vintage charm',
       'instant_film',
       'Instant film photograph of {subject}, Polaroid Originals style, white border frame, warm color palette, vintage instant camera aesthetic, nostalgic mood, authentic film grain',
       'digital, high resolution, sharp focus, modern camera, professional lighting, studio quality',
       '{"style":"polaroid_originals","lighting":"natural","background":"vintage","composition":"instant","film_type":"instant","border":"white","color_tone":"warm"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"instant_film","use_case":"nostalgic_photography","mood":"Nostalgic","tags":["polaroid","instant","vintage","warm","nostalgic"],"preset_type":"instant_film"}'::jsonb,
       true, true, 'Polaroid Originals Classic'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Polaroid Originals Classic');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Fujifilm Instax Mini',
       'Clean, bright Fujifilm Instax Mini instant film with crisp white borders and vibrant colors',
       'instant_film',
       'Fujifilm Instax Mini instant photograph of {subject}, clean white border, bright vibrant colors, crisp instant film aesthetic, modern instant camera style',
       'vintage, faded, low contrast, dark, film grain, aged, nostalgic',
       '{"style":"instax_mini","lighting":"bright","background":"clean","composition":"crisp","film_type":"instant","border":"white","color_accuracy":"high"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"instant_film","use_case":"modern_instant","mood":"Bright","tags":["instax","mini","instant","clean","bright","modern"],"preset_type":"instant_film"}'::jsonb,
       true, true, 'Fujifilm Instax Mini'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Fujifilm Instax Mini');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Black & White Instant Film',
       'Classic black and white instant film with high contrast and dramatic tones',
       'instant_film',
       'Black and white instant film photograph of {subject}, high contrast monochrome, dramatic black and white tones, classic instant film aesthetic, timeless monochrome instant photography',
       'color, colorful, muted, low contrast, faded, sepia, tinted',
       '{"style":"bw_instant","lighting":"contrast","background":"monochrome","composition":"dramatic","film_type":"instant","color":"monochrome","contrast":"high"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"instant_film","use_case":"monochrome_instant","mood":"Dramatic","tags":["black","white","monochrome","contrast","dramatic","timeless"],"preset_type":"instant_film"}'::jsonb,
       true, true, 'Black & White Instant Film'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Black & White Instant Film');

-- Add missing product presets
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Food Product Photography',
       'Appetizing food product photography with natural lighting and appetizing presentation for restaurants and food brands',
       'food',
       'Food product photography of {subject}, appetizing presentation, natural lighting, fresh ingredients, professional food styling, commercial food photography, appetizing composition',
       'unappetizing, dark, artificial lighting, stale, processed, fast food, low quality',
       '{"style":"food","lighting":"natural","background":"food_styling","composition":"appetizing","generation_mode":"text-to-image","category":"food"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"food_photography","use_case":"food_marketing","mood":"Appetizing","tags":["food","restaurant","appetizing","fresh","natural","culinary"],"preset_type":"product"}'::jsonb,
       true, true, 'Food Product Photography'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Food Product Photography');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Jewelry Product Photography',
       'Luxurious jewelry product photography with premium lighting and elegant presentation for jewelry brands',
       'jewelry',
       'Jewelry product photography of {subject}, premium luxury lighting, elegant presentation, high-end jewelry styling, luxurious composition, professional jewelry photography, sophisticated lighting setup',
       'cheap, low quality, poor lighting, casual, everyday, mass market, plastic',
       '{"style":"jewelry","lighting":"luxury","background":"elegant","composition":"sophisticated","generation_mode":"text-to-image","category":"jewelry"}'::jsonb,
       '{"resolution":"1024x1024","quality":"premium","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"jewelry_photography","use_case":"luxury_marketing","mood":"Luxurious","tags":["jewelry","luxury","elegant","premium","sophisticated","high-end"],"preset_type":"product"}'::jsonb,
       true, true, 'Jewelry Product Photography'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Jewelry Product Photography');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Fashion Product Photography',
       'Stylish fashion product photography with trendy styling and contemporary presentation for clothing brands',
       'fashion',
       'Fashion product photography of {subject}, trendy styling, contemporary presentation, fashion-forward composition, professional fashion photography, stylish lighting, modern fashion aesthetic',
       'outdated, vintage, conservative, formal, business, traditional, old-fashioned',
       '{"style":"fashion","lighting":"trendy","background":"contemporary","composition":"fashion_forward","generation_mode":"text-to-image","category":"fashion"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"fashion_photography","use_case":"fashion_marketing","mood":"Stylish","tags":["fashion","clothing","trendy","contemporary","stylish","modern"],"preset_type":"product"}'::jsonb,
       true, true, 'Fashion Product Photography'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Fashion Product Photography');

-- Add missing headshot presets
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Executive Portrait',
       'High-level executive portrait with sophisticated lighting and authoritative presence for C-suite professionals',
       'headshot',
       'Executive portrait of {subject}, sophisticated lighting, authoritative presence, premium business attire, confident leadership expression, high-end professional photography, executive styling',
       'casual, informal, young, entry-level, bright colors, playful, unprofessional',
       '{"style":"executive","lighting":"sophisticated","background":"premium","composition":"authoritative","generation_mode":"text-to-image","level":"executive"}'::jsonb,
       '{"resolution":"1024x1024","quality":"premium","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"executive_portrait","use_case":"c_suite_professional","mood":"Authoritative","tags":["executive","leadership","c-suite","sophisticated","premium"],"preset_type":"headshot"}'::jsonb,
       true, true, 'Executive Portrait'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Executive Portrait');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name)
SELECT 'Actor Headshot',
       'Professional actor headshot with dramatic lighting and expressive character, perfect for casting calls and portfolios',
       'headshot',
       'Actor headshot of {subject}, dramatic lighting, expressive character, professional acting headshot, casting call style, neutral background, natural expression, professional actor photography',
       'casual, corporate, business attire, formal suit, stiff, unexpressive, amateur',
       '{"style":"actor","lighting":"dramatic","background":"neutral","composition":"expressive","generation_mode":"text-to-image","industry":"entertainment"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"actor_headshot","use_case":"casting_portfolio","mood":"Expressive","tags":["actor","casting","entertainment","dramatic","expressive","portfolio"],"preset_type":"headshot"}'::jsonb,
       true, true, 'Actor Headshot'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Actor Headshot');

-- Verify the new presets were added
SELECT 
    name,
    category,
    ai_metadata->>'preset_type' as preset_type,
    ai_metadata->>'specialization' as specialization
FROM presets 
WHERE name IN (
    'Polaroid Originals Classic', 'Fujifilm Instax Mini', 'Black & White Instant Film',
    'Food Product Photography', 'Jewelry Product Photography', 'Fashion Product Photography',
    'Executive Portrait', 'Actor Headshot'
)
ORDER BY category, name;
