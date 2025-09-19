-- Treatments System Migration
-- Creates tables for treatment creation, editing, and sharing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Treatment formats enum
CREATE TYPE treatment_format AS ENUM (
  'film_tv',
  'documentary', 
  'commercial_brand',
  'music_video',
  'short_social',
  'corporate_promo'
);

-- Treatment status enum
CREATE TYPE treatment_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- Treatment themes/styles enum
CREATE TYPE treatment_theme AS ENUM (
  'cinematic',
  'minimal',
  'editorial',
  'bold_art',
  'brand_deck'
);

-- Main treatments table
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
  moodboard_id UUID REFERENCES moodboards(id) ON DELETE SET NULL,
  
  -- Core treatment data
  title TEXT NOT NULL,
  format treatment_format NOT NULL DEFAULT 'film_tv',
  status treatment_status NOT NULL DEFAULT 'draft',
  theme treatment_theme NOT NULL DEFAULT 'cinematic',
  
  -- Content structure
  outline_schema_version INTEGER NOT NULL DEFAULT 1,
  json_content JSONB NOT NULL DEFAULT '{}',
  
  -- Visual elements
  cover_image_id UUID,
  cover_image_url TEXT,
  
  -- Sharing and visibility
  is_public BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  showcase_id UUID,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT treatments_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Treatment versions for history and collaboration
CREATE TABLE treatment_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  json_content JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(treatment_id, version_number)
);

-- Treatment assets (links to moodboard images, user files, etc.)
CREATE TABLE treatment_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL, -- 'moodboard_image', 'user_file', 'external_url'
  asset_id UUID, -- references moodboard_images.id, user_files.id, etc.
  asset_url TEXT,
  asset_metadata JSONB DEFAULT '{}',
  position_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment analytics (views, engagement)
CREATE TABLE treatment_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id), -- null for anonymous views
  session_id TEXT,
  page_views INTEGER DEFAULT 1,
  time_on_page_seconds INTEGER DEFAULT 0,
  pages_viewed TEXT[], -- array of section IDs viewed
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment sharing permissions
CREATE TABLE treatment_sharing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  permission_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'comment', 'edit'
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(treatment_id, shared_with_user_id),
  UNIQUE(treatment_id, shared_with_email)
);

-- Indexes for performance
CREATE INDEX idx_treatments_owner_id ON treatments(owner_id);
CREATE INDEX idx_treatments_project_id ON treatments(project_id);
CREATE INDEX idx_treatments_status ON treatments(status);
CREATE INDEX idx_treatments_format ON treatments(format);
CREATE INDEX idx_treatments_is_public ON treatments(is_public);
CREATE INDEX idx_treatments_created_at ON treatments(created_at);

CREATE INDEX idx_treatment_versions_treatment_id ON treatment_versions(treatment_id);
CREATE INDEX idx_treatment_versions_version_number ON treatment_versions(version_number);

CREATE INDEX idx_treatment_assets_treatment_id ON treatment_assets(treatment_id);
CREATE INDEX idx_treatment_assets_asset_type ON treatment_assets(asset_type);

CREATE INDEX idx_treatment_analytics_treatment_id ON treatment_analytics(treatment_id);
CREATE INDEX idx_treatment_analytics_created_at ON treatment_analytics(created_at);

CREATE INDEX idx_treatment_sharing_treatment_id ON treatment_sharing(treatment_id);
CREATE INDEX idx_treatment_sharing_shared_with ON treatment_sharing(shared_with_user_id);

-- RLS Policies
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_sharing ENABLE ROW LEVEL SECURITY;

-- Treatments policies
CREATE POLICY "Users can view their own treatments" ON treatments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public treatments" ON treatments
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create treatments" ON treatments
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own treatments" ON treatments
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own treatments" ON treatments
  FOR DELETE USING (auth.uid() = owner_id);

-- Treatment versions policies
CREATE POLICY "Users can view treatment versions" ON treatment_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_versions.treatment_id 
      AND (owner_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can create treatment versions" ON treatment_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_versions.treatment_id 
      AND owner_id = auth.uid()
    )
  );

-- Treatment assets policies
CREATE POLICY "Users can view treatment assets" ON treatment_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_assets.treatment_id 
      AND (owner_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Users can manage treatment assets" ON treatment_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_assets.treatment_id 
      AND owner_id = auth.uid()
    )
  );

-- Treatment analytics policies (read-only for most users)
CREATE POLICY "Users can view their treatment analytics" ON treatment_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_analytics.treatment_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create treatment analytics" ON treatment_analytics
  FOR INSERT WITH CHECK (true);

-- Treatment sharing policies
CREATE POLICY "Users can view treatment sharing" ON treatment_sharing
  FOR SELECT USING (
    shared_with_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_sharing.treatment_id 
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage treatment sharing" ON treatment_sharing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM treatments 
      WHERE id = treatment_sharing.treatment_id 
      AND owner_id = auth.uid()
    )
  );

-- Functions for treatment management
CREATE OR REPLACE FUNCTION create_treatment_version(
  p_treatment_id UUID,
  p_change_summary TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_version_number INTEGER;
  v_treatment_content JSONB;
  v_version_id UUID;
BEGIN
  -- Get current content and next version number
  SELECT json_content, COALESCE(MAX(version_number), 0) + 1
  INTO v_treatment_content, v_version_number
  FROM treatments t
  LEFT JOIN treatment_versions tv ON t.id = tv.treatment_id
  WHERE t.id = p_treatment_id AND t.owner_id = auth.uid()
  GROUP BY t.json_content;
  
  IF v_treatment_content IS NULL THEN
    RAISE EXCEPTION 'Treatment not found or access denied';
  END IF;
  
  -- Create new version
  INSERT INTO treatment_versions (
    treatment_id, version_number, json_content, change_summary, created_by
  ) VALUES (
    p_treatment_id, v_version_number, v_treatment_content, p_change_summary, auth.uid()
  ) RETURNING id INTO v_version_id;
  
  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get treatment with latest version info
CREATE OR REPLACE FUNCTION get_treatment_with_versions(p_treatment_id UUID)
RETURNS TABLE (
  treatment JSONB,
  versions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(t.*) as treatment,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', tv.id,
          'version_number', tv.version_number,
          'change_summary', tv.change_summary,
          'created_at', tv.created_at
        ) ORDER BY tv.version_number DESC
      ) FILTER (WHERE tv.id IS NOT NULL),
      '[]'::jsonb
    ) as versions
  FROM treatments t
  LEFT JOIN treatment_versions tv ON t.id = tv.treatment_id
  WHERE t.id = p_treatment_id 
    AND (t.owner_id = auth.uid() OR t.is_public = true)
  GROUP BY t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track treatment view
CREATE OR REPLACE FUNCTION track_treatment_view(
  p_treatment_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO treatment_analytics (
    treatment_id, viewer_id, session_id, referrer, user_agent, ip_address
  ) VALUES (
    p_treatment_id, auth.uid(), p_session_id, p_referrer, p_user_agent, p_ip_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_treatment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_treatment_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_treatment_updated_at();

-- Note: Treatment templates will be created by the application
-- No default data insertion needed in migration
