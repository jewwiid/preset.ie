-- Additional Headshot and Product Photography Presets
-- Expanding the existing collection with specialized variations

INSERT INTO presets (
  id,
  user_id,
  name,
  description,
  category,
  prompt_template,
  negative_prompt,
  style_settings,
  technical_settings,
  ai_metadata,
  seedream_config,
  generation_mode,
  is_public,
  is_featured,
  usage_count,
  created_at,
  updated_at
) VALUES 

-- ADDITIONAL HEADSHOT PRESETS

-- Executive Portrait
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Executive Portrait',
  'High-level executive portrait with sophisticated lighting and authoritative presence for C-suite professionals.',
  'style',
  'Executive portrait of {subject}, sophisticated lighting, authoritative presence, premium business attire, confident leadership expression, high-end professional photography, executive styling',
  'casual, informal, young, entry-level, bright colors, playful, unprofessional',
  '{"style": "executive", "lighting": "sophisticated", "background": "premium", "composition": "authoritative", "generation_mode": "text-to-image", "level": "executive"}',
  '{"resolution": "1024x1024", "quality": "premium", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "executive_portrait", "use_case": "c_suite_professional", "optimized_for": "leadership profiles", "preset_type": "headshot", "mood": "Authoritative", "tags": ["executive", "leadership", "c-suite", "sophisticated", "premium"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.95}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Actor Headshot
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Actor Headshot',
  'Professional actor headshot with dramatic lighting and expressive character, perfect for casting calls and portfolios.',
  'style',
  'Actor headshot of {subject}, dramatic lighting, expressive character, professional acting headshot, casting call style, neutral background, natural expression, professional actor photography',
  'casual, corporate, business attire, formal suit, stiff, unexpressive, amateur',
  '{"style": "actor", "lighting": "dramatic", "background": "neutral", "composition": "expressive", "generation_mode": "text-to-image", "industry": "entertainment"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "actor_headshot", "use_case": "casting_portfolio", "optimized_for": "entertainment industry", "preset_type": "headshot", "mood": "Expressive", "tags": ["actor", "casting", "entertainment", "dramatic", "expressive", "portfolio"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Real Estate Agent Portrait
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Real Estate Agent Portrait',
  'Trustworthy real estate agent portrait with approachable expression and professional styling for property marketing.',
  'style',
  'Real estate agent portrait of {subject}, trustworthy expression, professional real estate styling, approachable demeanor, business casual attire, clean background, professional real estate photography',
  'formal suit, corporate, stiff, unapproachable, casual clothing, unprofessional, young',
  '{"style": "real_estate", "lighting": "natural", "background": "clean", "composition": "approachable", "generation_mode": "text-to-image", "industry": "real_estate"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "real_estate_portrait", "use_case": "property_marketing", "optimized_for": "real estate professionals", "preset_type": "headshot", "mood": "Trustworthy", "tags": ["real estate", "agent", "trustworthy", "approachable", "professional", "property"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Healthcare Professional Portrait
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Healthcare Professional Portrait',
  'Compassionate healthcare professional portrait with warm, caring expression and medical professional styling.',
  'style',
  'Healthcare professional portrait of {subject}, compassionate caring expression, medical professional styling, warm trustworthy demeanor, clean medical attire, professional healthcare photography',
  'casual, informal, cold, distant, unprofessional, bright colors, trendy',
  '{"style": "healthcare", "lighting": "warm", "background": "medical", "composition": "caring", "generation_mode": "text-to-image", "industry": "healthcare"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "healthcare_portrait", "use_case": "medical_marketing", "optimized_for": "healthcare professionals", "preset_type": "headshot", "mood": "Caring", "tags": ["healthcare", "medical", "doctor", "nurse", "compassionate", "caring"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Tech Professional Portrait
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Tech Professional Portrait',
  'Modern tech professional portrait with contemporary styling and innovative appearance for tech industry professionals.',
  'style',
  'Tech professional portrait of {subject}, modern contemporary styling, innovative appearance, tech industry professional, casual business attire, modern office background, professional tech photography',
  'formal suit, traditional, corporate, outdated, conservative, formal wear',
  '{"style": "tech", "lighting": "modern", "background": "contemporary", "composition": "innovative", "generation_mode": "text-to-image", "industry": "technology"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "tech_portrait", "use_case": "tech_marketing", "optimized_for": "technology professionals", "preset_type": "headshot", "mood": "Innovative", "tags": ["tech", "technology", "innovative", "modern", "contemporary", "startup"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- ADDITIONAL PRODUCT PRESETS

-- Food Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Food Product Photography',
  'Appetizing food product photography with natural lighting and appetizing presentation for restaurants and food brands.',
  'style',
  'Food product photography of {subject}, appetizing presentation, natural lighting, fresh ingredients, professional food styling, commercial food photography, appetizing composition',
  'unappetizing, dark, artificial lighting, stale, processed, fast food, low quality',
  '{"style": "food", "lighting": "natural", "background": "food_styling", "composition": "appetizing", "generation_mode": "text-to-image", "category": "food"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "food_photography", "use_case": "food_marketing", "optimized_for": "food brands", "preset_type": "product", "mood": "Appetizing", "tags": ["food", "restaurant", "appetizing", "fresh", "natural", "culinary"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Jewelry Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Jewelry Product Photography',
  'Luxurious jewelry product photography with premium lighting and elegant presentation for jewelry brands.',
  'style',
  'Jewelry product photography of {subject}, premium luxury lighting, elegant presentation, high-end jewelry styling, luxurious composition, professional jewelry photography, sophisticated lighting setup',
  'cheap, low quality, poor lighting, casual, everyday, mass market, plastic',
  '{"style": "jewelry", "lighting": "luxury", "background": "elegant", "composition": "sophisticated", "generation_mode": "text-to-image", "category": "jewelry"}',
  '{"resolution": "1024x1024", "quality": "premium", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "jewelry_photography", "use_case": "luxury_marketing", "optimized_for": "jewelry brands", "preset_type": "product", "mood": "Luxurious", "tags": ["jewelry", "luxury", "elegant", "premium", "sophisticated", "high-end"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.95}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Fashion Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Fashion Product Photography',
  'Stylish fashion product photography with trendy styling and contemporary presentation for clothing brands.',
  'style',
  'Fashion product photography of {subject}, trendy styling, contemporary presentation, fashion-forward composition, professional fashion photography, stylish lighting, modern fashion aesthetic',
  'outdated, vintage, conservative, formal, business, traditional, old-fashioned',
  '{"style": "fashion", "lighting": "trendy", "background": "contemporary", "composition": "fashion_forward", "generation_mode": "text-to-image", "category": "fashion"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "fashion_photography", "use_case": "fashion_marketing", "optimized_for": "fashion brands", "preset_type": "product", "mood": "Stylish", "tags": ["fashion", "clothing", "trendy", "contemporary", "stylish", "modern"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Electronics Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Electronics Product Photography',
  'Clean electronics product photography with technical precision and modern aesthetic for tech products.',
  'style',
  'Electronics product photography of {subject}, technical precision, modern aesthetic, clean product styling, professional tech photography, sleek lighting, contemporary tech presentation',
  'vintage, retro, cluttered, busy background, old technology, low-tech, analog',
  '{"style": "electronics", "lighting": "technical", "background": "clean", "composition": "precise", "generation_mode": "text-to-image", "category": "electronics"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "electronics_photography", "use_case": "tech_marketing", "optimized_for": "electronics brands", "preset_type": "product", "mood": "Modern", "tags": ["electronics", "tech", "modern", "clean", "precise", "sleek"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Beauty Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Beauty Product Photography',
  'Glamorous beauty product photography with soft lighting and elegant presentation for cosmetics and beauty brands.',
  'style',
  'Beauty product photography of {subject}, glamorous presentation, soft elegant lighting, beauty brand styling, luxurious beauty photography, sophisticated beauty composition, premium beauty aesthetic',
  'harsh lighting, clinical, medical, unglamorous, cheap, mass market, plain',
  '{"style": "beauty", "lighting": "soft", "background": "elegant", "composition": "glamorous", "generation_mode": "text-to-image", "category": "beauty"}',
  '{"resolution": "1024x1024", "quality": "premium", "consistency": "high", "aspect_ratio": "1:1"}',
  '{"specialization": "beauty_photography", "use_case": "beauty_marketing", "optimized_for": "beauty brands", "preset_type": "product", "mood": "Glamorous", "tags": ["beauty", "cosmetics", "glamorous", "elegant", "luxury", "sophisticated"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.95}}',
  'image',
  true,
  true,
  0,
  NOW(),
  NOW()
),

-- Automotive Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Automotive Product Photography',
  'Dynamic automotive product photography with dramatic lighting and powerful presentation for car brands.',
  'style',
  'Automotive product photography of {subject}, dramatic dynamic lighting, powerful presentation, automotive styling, professional car photography, dynamic composition, automotive brand aesthetic',
  'static, boring, simple lighting, pedestrian, everyday, basic, low-end',
  '{"style": "automotive", "lighting": "dramatic", "background": "dynamic", "composition": "powerful", "generation_mode": "text-to-image", "category": "automotive"}',
  '{"resolution": "1024x1024", "quality": "premium", "consistency": "high", "aspect_ratio": "16:9"}',
  '{"specialization": "automotive_photography", "use_case": "automotive_marketing", "optimized_for": "car brands", "preset_type": "product", "mood": "Powerful", "tags": ["automotive", "car", "dynamic", "powerful", "dramatic", "luxury"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.95}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
),

-- Furniture Product Photography
(
  gen_random_uuid(),
  'c231dca2-2973-46f6-98ba-a20c51d71b69',
  'Furniture Product Photography',
  'Stylish furniture product photography with lifestyle context and elegant interior presentation for furniture brands.',
  'style',
  'Furniture product photography of {subject}, lifestyle interior context, elegant furniture styling, professional furniture photography, sophisticated interior presentation, stylish home decor aesthetic',
  'outdoor, industrial, office, clinical, basic, cheap, mass-produced',
  '{"style": "furniture", "lighting": "interior", "background": "lifestyle", "composition": "elegant", "generation_mode": "text-to-image", "category": "furniture"}',
  '{"resolution": "1024x1024", "quality": "high", "consistency": "balanced", "aspect_ratio": "4:3"}',
  '{"specialization": "furniture_photography", "use_case": "furniture_marketing", "optimized_for": "furniture brands", "preset_type": "product", "mood": "Elegant", "tags": ["furniture", "home", "interior", "lifestyle", "elegant", "sophisticated"]}',
  '{"model": "seedream", "version": "v1", "settings": {"quality": 0.9}}',
  'image',
  true,
  false,
  0,
  NOW(),
  NOW()
);

-- Add comments for documentation
COMMENT ON TABLE presets IS 'Additional specialized headshot and product photography presets added';

-- Create specialized indexes
CREATE INDEX IF NOT EXISTS idx_presets_headshot_industry 
ON presets ((ai_metadata->>'industry')) 
WHERE ai_metadata->>'preset_type' = 'headshot';

CREATE INDEX IF NOT EXISTS idx_presets_product_category 
ON presets ((ai_metadata->>'category')) 
WHERE ai_metadata->>'preset_type' = 'product';
