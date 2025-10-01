-- Add sample images manually to the preset showcase
-- This bypasses the strict verification for testing purposes

-- 1. Add the Digital Art Style image to the Digital Art Style preset
INSERT INTO preset_images (
  preset_id,
  user_id,
  result_image_url,
  prompt_used,
  generation_id,
  generation_provider,
  generation_model,
  generation_credits,
  generation_settings,
  is_verified,
  verification_timestamp,
  verification_method,
  title,
  description,
  tags,
  created_at,
  updated_at
) VALUES (
  'ef8cb292-baeb-462d-bf0c-1041b585af71', -- Digital Art Style preset
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- Your user ID
  'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/playground-gallery/saved-image-1759192759863-n6naz0pyecq.jpeg',
  'Create a digital art style of a cat, clean digital lines, vibrant colors, modern aesthetic, digital painting technique, contemporary art',
  '248ba0ff-6b5c-4275-a05c-11dad72c2ef1', -- project_id from your data
  'seedream',
  'seedream-v4',
  2,
  '{"resolution":"1024x1024","aspect_ratio":"1:1","style":"digital_art","generation_mode":"text-to-image","consistency_level":"high","custom_style_preset_id":"ef8cb292-baeb-462d-bf0c-1041b585af71"}'::jsonb,
  true, -- Auto-verify for testing
  NOW(),
  'manual_test',
  'Digital Art Cat Sample',
  'Generated using the Digital Art Style preset with vibrant colors and clean digital lines. Subject: cat',
  ARRAY['digital-art', 'cat', 'vibrant', 'modern', 'contemporary'],
  NOW(),
  NOW()
);

-- 2. Add the professional headshot image to the Professional Corporate Headshot preset
INSERT INTO preset_images (
  preset_id,
  user_id,
  result_image_url,
  prompt_used,
  generation_id,
  generation_provider,
  generation_model,
  generation_credits,
  generation_settings,
  is_verified,
  verification_timestamp,
  verification_method,
  title,
  description,
  tags,
  created_at,
  updated_at
) VALUES (
  '163c2edb-f4b3-4120-824f-e1d068379c3e', -- Professional Corporate Headshot preset
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- Your user ID
  'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/playground-gallery/saved-image-1759262813549-0q4snfudsqiq.png',
  'Professional headshot of a girl, corporate style, clean lighting, neutral background, business attire, confident expression, high quality, professional photography',
  'cce0efe2-2270-4e0e-9b59-6960b711fa18', -- Use gallery ID as generation_id for first image
  'wavespeed-nanobanan',
  'seedream-v4',
  1,
  '{"resolution":"1024*1024","aspect_ratio":"1024:1024","style":"professional","generation_mode":"text-to-image","consistency_level":"high"}'::jsonb,
  true, -- Auto-verify for testing
  NOW(),
  'manual_test',
  'Professional Headshot Sample',
  'Generated using professional style with clean lighting and neutral background. Subject: girl',
  ARRAY['professional', 'headshot', 'corporate', 'business'],
  NOW(),
  NOW()
);

-- Add the second professional headshot image
INSERT INTO preset_images (
  preset_id,
  user_id,
  result_image_url,
  prompt_used,
  generation_id,
  generation_provider,
  generation_model,
  generation_credits,
  generation_settings,
  is_verified,
  verification_timestamp,
  verification_method,
  title,
  description,
  tags,
  created_at,
  updated_at
) VALUES (
  '163c2edb-f4b3-4120-824f-e1d068379c3e', -- Professional Corporate Headshot preset
  'c231dca2-2973-46f6-98ba-a20c51d71b69', -- Your user ID
  'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/playground-gallery/saved-image-1759262830801-6shq1cmq39.png',
  'Professional headshot of a girl, corporate style, clean lighting, neutral background, business attire, confident expression, high quality, professional photography',
  'e4315439-4350-406f-b96d-232dd1183ff3', -- Use gallery ID as generation_id for second image
  'wavespeed-nanobanan',
  'seedream-v4',
  1,
  '{"resolution":"1024*1024","aspect_ratio":"1024:1024","style":"professional","generation_mode":"text-to-image","consistency_level":"high"}'::jsonb,
  true, -- Auto-verify for testing
  NOW(),
  'manual_test',
  'Professional Headshot Sample 2',
  'Another example of professional headshot generation. Subject: girl',
  ARRAY['professional', 'headshot', 'corporate', 'business'],
  NOW(),
  NOW()
);
