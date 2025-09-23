-- Migration to expand preset categories beyond the current 4 options
-- This removes the restrictive CHECK constraint and allows for more granular categorization

-- Drop the existing CHECK constraint
ALTER TABLE presets DROP CONSTRAINT IF EXISTS valid_category;

-- Add a new CHECK constraint with expanded categories
ALTER TABLE presets ADD CONSTRAINT valid_category_expanded CHECK (
  category IN (
    -- Original categories
    'style', 'cinematic', 'technical', 'custom',
    
    -- Photography categories
    'photography', 'portrait', 'fashion', 'editorial', 'commercial', 
    'lifestyle', 'wedding', 'event', 'product', 'architecture', 
    'street', 'conceptual', 'fine_art', 'documentary', 'sports', 'nature',
    
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

-- Create an index on category for better performance
CREATE INDEX IF NOT EXISTS idx_presets_category ON presets(category);

-- Update any existing presets to use more specific categories if needed
-- (This is optional - existing presets will continue to work with the new constraint)
