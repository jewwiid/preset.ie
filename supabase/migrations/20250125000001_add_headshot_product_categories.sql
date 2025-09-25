-- Migration to add headshot and product photography categories
-- This expands the preset categories to include specialized photography types

-- First, check what constraints exist and drop them safely
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Get the constraint name dynamically
    SELECT conname INTO constraint_name 
    FROM pg_constraint 
    WHERE conrelid = 'presets'::regclass 
    AND contype = 'c' 
    AND conname LIKE '%category%';
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE presets DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Add a new CHECK constraint with headshot and product categories
ALTER TABLE presets ADD CONSTRAINT valid_category_expanded CHECK (
  category IN (
    -- Original categories
    'style', 'cinematic', 'technical', 'custom',
    
    -- Photography categories
    'photography', 'portrait', 'fashion', 'editorial', 'commercial', 
    'lifestyle', 'wedding', 'event', 'product', 'architecture', 
    'street', 'conceptual', 'fine_art', 'documentary', 'sports', 'nature',
    
    -- NEW: Specialized photography categories
    'headshot', 'product_photography', 'ecommerce', 'corporate_portrait',
    'professional_portrait', 'business_headshot', 'linkedin_photo',
    'product_catalog', 'product_lifestyle', 'product_studio',
    
    -- Artistic categories
    'artistic', 'painting', 'illustration', 'digital_art', 'traditional_art',
    'abstract', 'realism', 'impressionism', 'surrealism',
    
    -- Style categories
    'vintage', 'modern', 'minimalist', 'maximalist', 'retro', 'futuristic',
    'bohemian', 'industrial', 'scandinavian', 'mediterranean',
    
    -- Creative categories
    'creative', 'experimental', 'avant_garde', 'conceptual', 'artistic_vision',
    
    -- Professional categories
    'professional', 'corporate', 'branding', 'marketing', 'advertising',
    
    -- Specialized categories
    'cinematic', 'film_look', 'dramatic', 'moody', 'bright', 'high_key', 'low_key',
    'monochrome', 'colorful', 'neutral', 'warm', 'cool',
    
    -- Technical categories
    'technical', 'hdr', 'macro', 'panoramic', 'time_lapse', 'composite',
    'retouching', 'color_grading', 'post_processing'
  )
);

-- Create indexes for the new categories
CREATE INDEX IF NOT EXISTS idx_presets_headshot ON presets(category) WHERE category = 'headshot';
CREATE INDEX IF NOT EXISTS idx_presets_product_photography ON presets(category) WHERE category = 'product_photography';
CREATE INDEX IF NOT EXISTS idx_presets_ecommerce ON presets(category) WHERE category = 'ecommerce';

-- Insert sample headshot presets
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured) VALUES
(
  'Professional Headshot',
  'Clean, professional headshot with studio lighting, perfect for LinkedIn profiles and business portraits',
  'headshot',
  'professional headshot of {subject}, clean background, soft studio lighting, sharp focus, business portrait style, professional attire, confident expression, high quality, detailed',
  'casual clothing, messy hair, unprofessional, low quality, blurry, dark lighting, informal',
  '{"style": "professional_headshot", "lighting": "soft_studio", "background": "clean", "quality": "high", "focus": "sharp", "mood": "professional"}',
  '{"resolution": "1024x1024", "steps": 30, "guidance_scale": 8, "aspect_ratio": "1:1", "scheduler": "DPMSolverMultistepScheduler"}',
  '{"mood": "Professional", "tags": ["headshot", "professional", "portrait", "business", "linkedin"], "specialization": "headshot_photography", "use_case": "professional_networking"}',
  true,
  true
),
(
  'Corporate Portrait',
  'Executive-level corporate portrait with sophisticated lighting and professional styling',
  'corporate_portrait',
  'corporate portrait of {subject}, executive styling, sophisticated lighting, professional environment, confident demeanor, high-end business attire, clean background, premium quality',
  'casual wear, informal setting, low quality, amateur lighting, unprofessional',
  '{"style": "corporate_portrait", "lighting": "sophisticated", "background": "professional", "quality": "premium", "styling": "executive"}',
  '{"resolution": "1024x1024", "steps": 35, "guidance_scale": 8.5, "aspect_ratio": "1:1"}',
  '{"mood": "Executive", "tags": ["corporate", "executive", "professional", "business"], "specialization": "corporate_photography", "use_case": "executive_profiles"}',
  true,
  true
),
(
  'LinkedIn Profile Photo',
  'Optimized for LinkedIn profiles with perfect lighting and professional appeal',
  'linkedin_photo',
  'linkedin profile photo of {subject}, professional headshot, clean white background, soft natural lighting, confident smile, business casual attire, high quality, professional appearance',
  'casual clothing, informal pose, low quality, dark background, unprofessional',
  '{"style": "linkedin_optimized", "lighting": "natural_soft", "background": "white", "quality": "high", "pose": "confident"}',
  '{"resolution": "1024x1024", "steps": 25, "guidance_scale": 7.5, "aspect_ratio": "1:1"}',
  '{"mood": "Confident", "tags": ["linkedin", "professional", "headshot", "networking"], "specialization": "social_media_professional", "use_case": "linkedin_profiles"}',
  true,
  false
);

-- Insert sample product photography presets
INSERT INTO presets (name, description, category, prompt_template, negative_prompt, style_settings, technical_settings, ai_metadata, is_public, is_featured) VALUES
(
  'E-commerce Product Shot',
  'Clean, professional product photography optimized for e-commerce and online catalogs',
  'product_photography',
  'professional product photography of {subject}, clean white background, studio lighting, sharp focus, high quality, commercial style, product catalog shot, professional lighting setup',
  'cluttered background, poor lighting, low quality, amateur photography, messy setup',
  '{"style": "ecommerce_product", "lighting": "studio_clean", "background": "white", "quality": "commercial", "focus": "product_detail"}',
  '{"resolution": "1024x1024", "steps": 30, "guidance_scale": 8, "aspect_ratio": "1:1"}',
  '{"mood": "Clean", "tags": ["product", "ecommerce", "commercial", "catalog"], "specialization": "product_photography", "use_case": "ecommerce_catalog"}',
  true,
  true
),
(
  'Product Lifestyle Shot',
  'Product in natural lifestyle setting, showing real-world usage and appeal',
  'product_lifestyle',
  'lifestyle product photography of {subject}, natural setting, lifestyle context, authentic use, warm lighting, aspirational lifestyle, high quality, commercial photography',
  'artificial setup, unrealistic context, poor lighting, low quality, amateur',
  '{"style": "lifestyle_product", "lighting": "natural_warm", "background": "lifestyle", "quality": "commercial", "context": "authentic"}',
  '{"resolution": "1024x1024", "steps": 28, "guidance_scale": 7.8, "aspect_ratio": "1:1"}',
  '{"mood": "Aspirational", "tags": ["lifestyle", "product", "commercial", "authentic"], "specialization": "lifestyle_photography", "use_case": "marketing_campaigns"}',
  true,
  true
),
(
  'Product Studio Shot',
  'High-end studio product photography with professional lighting and composition',
  'product_studio',
  'studio product photography of {subject}, professional studio setup, controlled lighting, perfect composition, commercial quality, product focus, clean presentation',
  'poor lighting, amateur setup, cluttered composition, low quality, unprofessional',
  '{"style": "studio_product", "lighting": "controlled_studio", "background": "clean", "quality": "premium", "composition": "professional"}',
  '{"resolution": "1024x1024", "steps": 35, "guidance_scale": 8.5, "aspect_ratio": "1:1"}',
  '{"mood": "Premium", "tags": ["studio", "product", "commercial", "professional"], "specialization": "studio_photography", "use_case": "premium_catalog"}',
  true,
  false
);

-- Verify the constraint was applied correctly
DO $$
BEGIN
    -- Test that the new categories are accepted
    BEGIN
        -- This should work with the new constraint
        INSERT INTO presets (name, description, category, prompt_template, is_public) 
        VALUES ('Test Headshot', 'Test', 'headshot', 'test prompt', false);
        
        -- Clean up test record
        DELETE FROM presets WHERE name = 'Test Headshot';
        
        RAISE NOTICE 'Constraint verification successful - new categories are accepted';
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Constraint verification failed: %', SQLERRM;
    END;
END $$;

-- Add comments for documentation
COMMENT ON TABLE presets IS 'Comprehensive presets table now includes specialized headshot and product photography categories';
