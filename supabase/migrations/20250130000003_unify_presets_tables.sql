-- Unify presets and cinematic_presets tables
-- This migration standardizes the structure between both preset tables
-- Created: 2025-01-30

-- ==============================================
-- STEP 1: Add missing columns to cinematic_presets
-- ==============================================

-- Add user_id column (nullable for system presets)
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add prompt configuration columns
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS prompt_template TEXT;

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS negative_prompt TEXT;

-- Add style and technical settings (migrate from parameters)
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS style_settings JSONB DEFAULT '{}';

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS technical_settings JSONB DEFAULT '{}';

-- Add AI metadata
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}';

-- Add Seedream configuration
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS seedream_config JSONB DEFAULT '{}';

-- Add generation mode
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(20) DEFAULT 'image' 
CHECK (generation_mode IN ('image', 'video', 'both'));

-- Add visibility and sharing columns
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true; -- Cinematic presets are public by default

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add usage tracking
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Add marketplace columns (nullable for system presets)
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS sale_price INTEGER DEFAULT 0;

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS marketplace_status VARCHAR(20) DEFAULT 'private' 
CHECK (marketplace_status IN ('private', 'pending_review', 'approved', 'rejected', 'sold_out'));

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS revenue_earned INTEGER DEFAULT 0;

-- Add likes count
ALTER TABLE cinematic_presets 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ==============================================
-- STEP 2: Add missing columns to presets table
-- ==============================================

-- Add display_name column
ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Add is_active column
ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add sort_order column
ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add marketplace columns to presets table (if they don't exist from previous migrations)
ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;

ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS sale_price INTEGER DEFAULT 0;

ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS seller_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS marketplace_status VARCHAR(20) DEFAULT 'private' 
CHECK (marketplace_status IN ('private', 'pending_review', 'approved', 'rejected', 'sold_out'));

ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;

ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS revenue_earned INTEGER DEFAULT 0;

-- Add likes count to presets table (if it doesn't exist from previous migrations)
ALTER TABLE presets 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- ==============================================
-- STEP 3: Migrate data from parameters to style_settings
-- ==============================================

-- Update cinematic_presets to move parameters to style_settings
UPDATE cinematic_presets 
SET style_settings = COALESCE(parameters, '{}'::jsonb)
WHERE parameters IS NOT NULL AND style_settings = '{}';

-- ==============================================
-- STEP 4: Add missing indexes to cinematic_presets
-- ==============================================

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_user_id ON cinematic_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_is_public ON cinematic_presets(is_public);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_is_featured ON cinematic_presets(is_featured);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_usage_count ON cinematic_presets(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_created_at ON cinematic_presets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_marketplace_status ON cinematic_presets(marketplace_status);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_is_for_sale ON cinematic_presets(is_for_sale);

-- Add GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_style_settings ON cinematic_presets USING GIN(style_settings);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_technical_settings ON cinematic_presets USING GIN(technical_settings);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_ai_metadata ON cinematic_presets USING GIN(ai_metadata);
CREATE INDEX IF NOT EXISTS idx_cinematic_presets_seedream_config ON cinematic_presets USING GIN(seedream_config);

-- ==============================================
-- STEP 5: Add missing indexes to presets table
-- ==============================================

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_presets_display_name ON presets(display_name);
CREATE INDEX IF NOT EXISTS idx_presets_is_active ON presets(is_active);
CREATE INDEX IF NOT EXISTS idx_presets_sort_order ON presets(sort_order);
CREATE INDEX IF NOT EXISTS idx_presets_marketplace_status ON presets(marketplace_status);
CREATE INDEX IF NOT EXISTS idx_presets_is_for_sale ON presets(is_for_sale);

-- ==============================================
-- STEP 6: Update RLS policies for cinematic_presets
-- ==============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access to cinematic presets" ON cinematic_presets;
DROP POLICY IF EXISTS "Allow admin access to cinematic presets" ON cinematic_presets;

-- Create new comprehensive policies
CREATE POLICY "Users can view public cinematic presets" ON cinematic_presets
    FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "Users can view their own cinematic presets" ON cinematic_presets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create cinematic presets" ON cinematic_presets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cinematic presets" ON cinematic_presets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cinematic presets" ON cinematic_presets
    FOR DELETE USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can manage all cinematic presets" ON cinematic_presets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE users_profile.id = auth.uid() 
            AND 'ADMIN'::user_role = ANY(users_profile.role_flags)
        )
    );

-- ==============================================
-- STEP 7: Add constraints and validations
-- ==============================================

-- Add constraints to cinematic_presets (using DO block to handle IF NOT EXISTS)
DO $$
BEGIN
    -- Add constraints only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_usage_count' 
        AND conrelid = 'cinematic_presets'::regclass
    ) THEN
        ALTER TABLE cinematic_presets 
        ADD CONSTRAINT valid_usage_count CHECK (usage_count >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_sale_price' 
        AND conrelid = 'cinematic_presets'::regclass
    ) THEN
        ALTER TABLE cinematic_presets 
        ADD CONSTRAINT valid_sale_price CHECK (sale_price >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_total_sales' 
        AND conrelid = 'cinematic_presets'::regclass
    ) THEN
        ALTER TABLE cinematic_presets 
        ADD CONSTRAINT valid_total_sales CHECK (total_sales >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_revenue_earned' 
        AND conrelid = 'cinematic_presets'::regclass
    ) THEN
        ALTER TABLE cinematic_presets 
        ADD CONSTRAINT valid_revenue_earned CHECK (revenue_earned >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_likes_count' 
        AND conrelid = 'cinematic_presets'::regclass
    ) THEN
        ALTER TABLE cinematic_presets 
        ADD CONSTRAINT valid_likes_count CHECK (likes_count >= 0);
    END IF;
END $$;

-- ==============================================
-- STEP 8: Update display_name for existing presets
-- ==============================================

-- Set display_name to name if it's null for existing presets
UPDATE presets 
SET display_name = name 
WHERE display_name IS NULL;

-- Set display_name to display_name for existing cinematic_presets (already has it)

-- ==============================================
-- STEP 9: Add comments for documentation
-- ==============================================

COMMENT ON COLUMN cinematic_presets.user_id IS 'User who created the preset (null for system presets)';
COMMENT ON COLUMN cinematic_presets.display_name IS 'Human-readable display name for the preset';
COMMENT ON COLUMN cinematic_presets.parameters IS 'Legacy parameter format (migrated to style_settings)';
COMMENT ON COLUMN cinematic_presets.style_settings IS 'JSONB object containing style-related settings';
COMMENT ON COLUMN cinematic_presets.technical_settings IS 'JSONB object containing technical settings';
COMMENT ON COLUMN cinematic_presets.ai_metadata IS 'JSONB object containing AI-specific metadata';
COMMENT ON COLUMN cinematic_presets.seedream_config IS 'JSONB object containing Seedream-specific configuration';
COMMENT ON COLUMN cinematic_presets.generation_mode IS 'Type of content this preset generates: image, video, or both';
COMMENT ON COLUMN cinematic_presets.is_active IS 'Whether this preset is currently active/available';
COMMENT ON COLUMN cinematic_presets.sort_order IS 'Order for displaying presets in lists';

COMMENT ON COLUMN presets.display_name IS 'Human-readable display name for the preset';
COMMENT ON COLUMN presets.is_active IS 'Whether this preset is currently active/available';
COMMENT ON COLUMN presets.sort_order IS 'Order for displaying presets in lists';

-- ==============================================
-- STEP 10: Create unified view for easier querying
-- ==============================================

-- Create a view that combines both preset types
CREATE OR REPLACE VIEW unified_presets AS
SELECT 
    id,
    'regular' as preset_type,
    user_id,
    name,
    display_name,
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
    is_active,
    sort_order,
    usage_count,
    last_used_at,
    is_for_sale,
    sale_price,
    seller_user_id,
    marketplace_status,
    total_sales,
    revenue_earned,
    likes_count,
    created_at,
    updated_at
FROM presets
WHERE is_active = true

UNION ALL

SELECT 
    id,
    'cinematic' as preset_type,
    user_id,
    name,
    display_name,
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
    is_active,
    sort_order,
    usage_count,
    last_used_at,
    is_for_sale,
    sale_price,
    seller_user_id,
    marketplace_status,
    total_sales,
    revenue_earned,
    likes_count,
    created_at,
    updated_at
FROM cinematic_presets
WHERE is_active = true;

-- Add comment for the view
COMMENT ON VIEW unified_presets IS 'Unified view of both regular and cinematic presets with consistent structure';

-- ==============================================
-- STEP 11: Create helper functions
-- ==============================================

-- Function to get preset by ID (handles both types)
CREATE OR REPLACE FUNCTION get_preset_by_id(preset_id UUID)
RETURNS TABLE (
    id UUID,
    preset_type TEXT,
    user_id UUID,
    name VARCHAR,
    display_name VARCHAR,
    description TEXT,
    category VARCHAR,
    prompt_template TEXT,
    negative_prompt TEXT,
    style_settings JSONB,
    technical_settings JSONB,
    ai_metadata JSONB,
    seedream_config JSONB,
    generation_mode VARCHAR,
    is_public BOOLEAN,
    is_featured BOOLEAN,
    is_active BOOLEAN,
    sort_order INTEGER,
    usage_count INTEGER,
    last_used_at TIMESTAMPTZ,
    is_for_sale BOOLEAN,
    sale_price INTEGER,
    seller_user_id UUID,
    marketplace_status VARCHAR,
    total_sales INTEGER,
    revenue_earned INTEGER,
    likes_count INTEGER,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM unified_presets WHERE unified_presets.id = preset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count for any preset
CREATE OR REPLACE FUNCTION increment_preset_usage(preset_id UUID, preset_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF preset_type = 'cinematic' THEN
        UPDATE cinematic_presets 
        SET usage_count = usage_count + 1, last_used_at = NOW()
        WHERE id = preset_id;
    ELSE
        UPDATE presets 
        SET usage_count = usage_count + 1, last_used_at = NOW()
        WHERE id = preset_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- Migration completed successfully
-- ==============================================
