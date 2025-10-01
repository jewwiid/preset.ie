-- Add Specialized Preset Categories - Simple Version
-- Run this in Supabase SQL Editor after updating the constraint

-- 1. WEDDING & EVENTS PRESETS
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Wedding Ceremony Portrait',
       'Romantic wedding ceremony portraits with soft lighting and elegant composition',
       'wedding_events',
       'Wedding ceremony portrait of {subject}, romantic lighting, soft and elegant, wedding dress, ceremony setting, emotional moment, professional wedding photography',
       'casual, street photography, dark, unprofessional, amateur, blurry',
       '{"style":"wedding","lighting":"soft_romantic","background":"ceremony","composition":"portrait","mood":"romantic","setting":"formal"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"wedding_photography","use_case":"wedding_portraits","mood":"Romantic","tags":["wedding","romantic","ceremony","elegant","portrait"],"preset_type":"wedding"}'::jsonb,
       true, true, 'Wedding Ceremony Portrait', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Wedding Ceremony Portrait');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Event Photography',
       'Professional event photography for corporate events, parties, and celebrations',
       'wedding_events',
       'Professional event photography of {subject}, event setting, natural lighting, candid moments, celebration atmosphere, professional event documentation',
       'wedding, formal portrait, studio, dark, blurry, amateur',
       '{"style":"event","lighting":"natural","background":"event","composition":"candid","mood":"celebratory","setting":"event"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"event_photography","use_case":"event_documentation","mood":"Celebratory","tags":["event","corporate","party","celebration","professional"],"preset_type":"event"}'::jsonb,
       true, true, 'Event Photography', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Event Photography');

-- 2. REAL ESTATE & ARCHITECTURE PRESETS
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Real Estate Interior',
       'Professional real estate interior photography with wide angles and natural lighting',
       'real_estate',
       'Real estate interior photography of {subject}, wide angle view, natural lighting, clean and spacious, modern interior design, professional real estate photography',
       'narrow angle, dark, cluttered, unprofessional, amateur, low quality',
       '{"style":"real_estate","lighting":"natural","background":"interior","composition":"wide_angle","mood":"spacious","setting":"interior"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"16:9"}'::jsonb,
       '{"specialization":"real_estate_photography","use_case":"property_marketing","mood":"Spacious","tags":["real_estate","interior","property","wide_angle","professional"],"preset_type":"real_estate"}'::jsonb,
       true, true, 'Real Estate Interior', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Real Estate Interior');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Architecture Exterior',
       'Professional architectural exterior photography showcasing building design and structure',
       'real_estate',
       'Architectural exterior photography of {subject}, building facade, professional architecture photography, clean lines, modern design, natural lighting',
       'interior, dark, blurry, amateur, low quality, unprofessional',
       '{"style":"architecture","lighting":"natural","background":"exterior","composition":"architectural","mood":"modern","setting":"exterior"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"16:9"}'::jsonb,
       '{"specialization":"architecture_photography","use_case":"architectural_documentation","mood":"Modern","tags":["architecture","building","exterior","design","professional"],"preset_type":"architecture"}'::jsonb,
       true, true, 'Architecture Exterior', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Architecture Exterior');

-- 3. FASHION & LIFESTYLE PRESETS
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Fashion Editorial',
       'High-fashion editorial photography with dramatic lighting and artistic composition',
       'fashion_lifestyle',
       'Fashion editorial photography of {subject}, high fashion style, dramatic lighting, artistic composition, editorial fashion photography, professional model',
       'casual, street wear, amateur, unprofessional, dark, blurry',
       '{"style":"fashion_editorial","lighting":"dramatic","background":"studio","composition":"editorial","mood":"dramatic","setting":"studio"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"3:4"}'::jsonb,
       '{"specialization":"fashion_photography","use_case":"editorial_fashion","mood":"Dramatic","tags":["fashion","editorial","high-fashion","dramatic","artistic"],"preset_type":"fashion"}'::jsonb,
       true, true, 'Fashion Editorial', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Fashion Editorial');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Lifestyle Portrait',
       'Natural lifestyle portraits capturing authentic moments and emotions',
       'fashion_lifestyle',
       'Lifestyle portrait of {subject}, natural setting, authentic moment, candid photography, natural lighting, lifestyle photography style',
       'studio, posed, artificial lighting, formal, corporate, stiff',
       '{"style":"lifestyle","lighting":"natural","background":"natural","composition":"candid","mood":"authentic","setting":"natural"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"lifestyle_photography","use_case":"lifestyle_portraits","mood":"Authentic","tags":["lifestyle","natural","candid","authentic","portrait"],"preset_type":"lifestyle"}'::jsonb,
       true, true, 'Lifestyle Portrait', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Lifestyle Portrait');

-- 4. FOOD & CULINARY PRESETS
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Restaurant Food Photography',
       'Professional restaurant food photography with appetizing lighting and styling',
       'food_culinary',
       'Restaurant food photography of {subject}, appetizing presentation, professional food styling, natural lighting, culinary photography, delicious appearance',
       'unappetizing, dark, blurry, amateur, low quality, unprofessional',
       '{"style":"restaurant_food","lighting":"natural","background":"restaurant","composition":"food_styling","mood":"appetizing","setting":"restaurant"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"food_photography","use_case":"restaurant_marketing","mood":"Appetizing","tags":["food","restaurant","culinary","appetizing","professional"],"preset_type":"food"}'::jsonb,
       true, true, 'Restaurant Food Photography', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Restaurant Food Photography');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Recipe Photography',
       'Clean recipe photography perfect for cookbooks and food blogs',
       'food_culinary',
       'Recipe photography of {subject}, clean presentation, step-by-step cooking, natural lighting, recipe documentation, culinary instruction',
       'messy, unappetizing, dark, blurry, amateur, unprofessional',
       '{"style":"recipe","lighting":"natural","background":"clean","composition":"instructional","mood":"clean","setting":"kitchen"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"4:3"}'::jsonb,
       '{"specialization":"recipe_photography","use_case":"cookbook_blog","mood":"Clean","tags":["recipe","cooking","instructional","clean","culinary"],"preset_type":"recipe"}'::jsonb,
       true, true, 'Recipe Photography', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Recipe Photography');

-- 5. PET & ANIMAL PRESETS
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Pet Portrait',
       'Professional pet photography capturing personality and charm',
       'pet_animal',
       'Pet portrait of {subject}, professional pet photography, natural lighting, capturing pet personality, animal portrait, cute and charming',
       'wild animal, dangerous, dark, blurry, amateur, unprofessional',
       '{"style":"pet_portrait","lighting":"natural","background":"natural","composition":"portrait","mood":"charming","setting":"natural"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"pet_photography","use_case":"pet_portraits","mood":"Charming","tags":["pet","animal","portrait","cute","personality"],"preset_type":"pet"}'::jsonb,
       true, true, 'Pet Portrait', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Pet Portrait');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Wildlife Photography',
       'Professional wildlife photography in natural habitats',
       'pet_animal',
       'Wildlife photography of {subject}, natural habitat, professional wildlife photography, natural lighting, animal in environment, wildlife documentation',
       'domestic pet, studio, artificial lighting, zoo, captivity, amateur',
       '{"style":"wildlife","lighting":"natural","background":"habitat","composition":"environmental","mood":"natural","setting":"wild"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"16:9"}'::jsonb,
       '{"specialization":"wildlife_photography","use_case":"nature_documentation","mood":"Natural","tags":["wildlife","nature","animal","habitat","natural"],"preset_type":"wildlife"}'::jsonb,
       true, true, 'Wildlife Photography', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Wildlife Photography');

-- 6. TRAVEL & LANDSCAPE PRESETS
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Travel Portrait',
       'Authentic travel portraits capturing local culture and people',
       'travel_landscape',
       'Travel portrait of {subject}, local culture, authentic travel photography, natural lighting, cultural setting, travel documentation',
       'studio, posed, artificial lighting, tourist, staged, amateur',
       '{"style":"travel","lighting":"natural","background":"cultural","composition":"portrait","mood":"authentic","setting":"travel"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"balanced","aspect_ratio":"1:1"}'::jsonb,
       '{"specialization":"travel_photography","use_case":"travel_documentation","mood":"Authentic","tags":["travel","culture","local","authentic","portrait"],"preset_type":"travel"}'::jsonb,
       true, true, 'Travel Portrait', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Travel Portrait');

INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured, display_name, user_id)
SELECT 'Landscape Photography',
       'Stunning landscape photography with dramatic natural lighting',
       'travel_landscape',
       'Landscape photography of {subject}, dramatic natural lighting, scenic view, professional landscape photography, natural environment, breathtaking scenery',
       'portrait, people, urban, city, dark, blurry, amateur',
       '{"style":"landscape","lighting":"natural","background":"scenic","composition":"landscape","mood":"dramatic","setting":"nature"}'::jsonb,
       '{"resolution":"1024x1024","quality":"high","consistency":"high","aspect_ratio":"16:9"}'::jsonb,
       '{"specialization":"landscape_photography","use_case":"nature_photography","mood":"Dramatic","tags":["landscape","nature","scenic","dramatic","environment"],"preset_type":"landscape"}'::jsonb,
       true, true, 'Landscape Photography', 'c231dca2-2973-46f6-98ba-a20c51d71b69'
WHERE NOT EXISTS (SELECT 1 FROM presets WHERE name = 'Landscape Photography');

-- Verify the new presets were added
SELECT 
    name,
    category,
    is_public,
    is_featured
FROM presets 
WHERE category IN ('wedding_events', 'real_estate', 'fashion_lifestyle', 'food_culinary', 'pet_animal', 'travel_landscape')
ORDER BY category, name;
