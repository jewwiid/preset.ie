-- Add missing presets with correct categories
-- This script adds the missing instant film presets and other categories

-- First, ensure the category constraint is updated (run fix_category_constraint.sql first)

-- Add missing instant film presets
INSERT INTO presets (
  name, description, category, prompt_template, negative_prompt, 
  style_settings, technical_settings, ai_metadata, is_public, is_featured
) VALUES 

-- Instant Film Presets
(
  'Polaroid Originals Classic',
  'Classic Polaroid instant film with iconic white border, warm tones, and vintage charm',
  'instant_film',
  'Instant film photograph of {subject}, Polaroid Originals style, white border frame, warm color palette, vintage instant camera aesthetic, nostalgic mood, authentic film grain',
  'digital, high resolution, sharp focus, modern camera, professional lighting, studio quality',
  '{"style":"polaroid_originals","lighting":"natural","background":"vintage","composition":"instant","film_type":"instant","border":"white","color_tone":"warm"}',
  '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"1:1"}',
  '{"specialization":"instant_film","use_case":"nostalgic_photography","mood":"Nostalgic","tags":["polaroid","instant","vintage","warm","nostalgic"],"preset_type":"instant_film"}',
  true, true
),

(
  'Fujifilm Instax Mini',
  'Clean, bright Fujifilm Instax Mini instant film with crisp white borders and vibrant colors',
  'instant_film',
  'Fujifilm Instax Mini instant photograph of {subject}, clean white border, bright vibrant colors, crisp instant film aesthetic, modern instant camera style',
  'vintage, faded, low contrast, dark, film grain, aged, nostalgic',
  '{"style":"instax_mini","lighting":"bright","background":"clean","composition":"crisp","film_type":"instant","border":"white","color_accuracy":"high"}',
  '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"instant_film","use_case":"modern_instant","mood":"Bright","tags":["instax","mini","instant","clean","bright","modern"],"preset_type":"instant_film"}',
  true, true
),

(
  'Black & White Instant Film',
  'Classic black and white instant film with high contrast and dramatic tones',
  'instant_film',
  'Black and white instant film photograph of {subject}, high contrast monochrome, dramatic black and white tones, classic instant film aesthetic, timeless monochrome instant photography',
  'color, colorful, muted, low contrast, faded, sepia, tinted',
  '{"style":"bw_instant","lighting":"contrast","background":"monochrome","composition":"dramatic","film_type":"instant","color":"monochrome","contrast":"high"}',
  '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"instant_film","use_case":"monochrome_instant","mood":"Dramatic","tags":["black","white","monochrome","contrast","dramatic","timeless"],"preset_type":"instant_film"}',
  true, true
),

-- Additional Product Presets
(
  'Food Product Photography',
  'Appetizing food product photography with natural lighting and appetizing presentation for restaurants and food brands',
  'food',
  'Food product photography of {subject}, appetizing presentation, natural lighting, fresh ingredients, professional food styling, commercial food photography, appetizing composition',
  'unappetizing, dark, artificial lighting, stale, processed, fast food, low quality',
  '{"style":"food","lighting":"natural","background":"food_styling","composition":"appetizing","generation_mode":"text-to-image","category":"food"}',
  '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"food_photography","use_case":"food_marketing","mood":"Appetizing","tags":["food","restaurant","appetizing","fresh","natural","culinary"],"preset_type":"product"}',
  true, true
),

(
  'Jewelry Product Photography',
  'Luxurious jewelry product photography with premium lighting and elegant presentation for jewelry brands',
  'jewelry',
  'Jewelry product photography of {subject}, premium luxury lighting, elegant presentation, high-end jewelry styling, luxurious composition, professional jewelry photography, sophisticated lighting setup',
  'cheap, low quality, poor lighting, casual, everyday, mass market, plastic',
  '{"style":"jewelry","lighting":"luxury","background":"elegant","composition":"sophisticated","generation_mode":"text-to-image","category":"jewelry"}',
  '{"resolution":"1024x1024","quality":"premium","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"jewelry_photography","use_case":"luxury_marketing","mood":"Luxurious","tags":["jewelry","luxury","elegant","premium","sophisticated","high-end"],"preset_type":"product"}',
  true, true
),

(
  'Fashion Product Photography',
  'Stylish fashion product photography with trendy styling and contemporary presentation for clothing brands',
  'fashion',
  'Fashion product photography of {subject}, trendy styling, contemporary presentation, fashion-forward composition, professional fashion photography, stylish lighting, modern fashion aesthetic',
  'outdated, vintage, conservative, formal, business, traditional, old-fashioned',
  '{"style":"fashion","lighting":"trendy","background":"contemporary","composition":"fashion_forward","generation_mode":"text-to-image","category":"fashion"}',
  '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"fashion_photography","use_case":"fashion_marketing","mood":"Stylish","tags":["fashion","clothing","trendy","contemporary","stylish","modern"],"preset_type":"product"}',
  true, true
),

-- Additional Headshot Presets
(
  'Executive Portrait',
  'High-level executive portrait with sophisticated lighting and authoritative presence for C-suite professionals',
  'headshot',
  'Executive portrait of {subject}, sophisticated lighting, authoritative presence, premium business attire, confident leadership expression, high-end professional photography, executive styling',
  'casual, informal, young, entry-level, bright colors, playful, unprofessional',
  '{"style":"executive","lighting":"sophisticated","background":"premium","composition":"authoritative","generation_mode":"text-to-image","level":"executive"}',
  '{"resolution":"1024x1024","quality":"premium","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"executive_portrait","use_case":"c_suite_professional","mood":"Authoritative","tags":["executive","leadership","c-suite","sophisticated","premium"],"preset_type":"headshot"}',
  true, true
),

(
  'Actor Headshot',
  'Professional actor headshot with dramatic lighting and expressive character, perfect for casting calls and portfolios',
  'headshot',
  'Actor headshot of {subject}, dramatic lighting, expressive character, professional acting headshot, casting call style, neutral background, natural expression, professional actor photography',
  'casual, corporate, business attire, formal suit, stiff, unexpressive, amateur',
  '{"style":"actor","lighting":"dramatic","background":"neutral","composition":"expressive","generation_mode":"text-to-image","industry":"entertainment"}',
  '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}',
  '{"specialization":"actor_headshot","use_case":"casting_portfolio","mood":"Expressive","tags":["actor","casting","entertainment","dramatic","expressive","portfolio"],"preset_type":"headshot"}',
  true, true
)

-- Note: Removed ON CONFLICT clause since there's no unique constraint on name
-- Run this script only once to avoid duplicates

-- Verify the new presets were added
SELECT 
    name,
    category,
    ai_metadata->>'preset_type' as preset_type,
    ai_metadata->>'specialization' as specialization
FROM presets 
WHERE category IN ('instant_film', 'food', 'jewelry', 'fashion', 'headshot')
ORDER BY category, name;
