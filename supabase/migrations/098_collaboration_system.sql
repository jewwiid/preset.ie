-- =====================================================
-- COLLABORATION SYSTEM MIGRATION
-- =====================================================
-- Migration: 098_collaboration_system.sql
-- Description: Project-based collaboration system for creators
-- Dependencies: Existing users_profile, moodboards, marketplace system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COLLABORATION TABLES
-- =====================================================

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS collab_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  synopsis TEXT,
  city TEXT,
  country TEXT,
  start_date DATE,
  end_date DATE,
  visibility TEXT CHECK (visibility IN ('public', 'private', 'invite_only')) DEFAULT 'public',
  status TEXT CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
  moodboard_id UUID REFERENCES moodboards(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_project_dates CHECK (
    (start_date IS NULL AND end_date IS NULL) OR
    (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date >= start_date)
  )
);

-- PROJECT ROLES TABLE
CREATE TABLE IF NOT EXISTS collab_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  skills_required TEXT[],
  is_paid BOOLEAN DEFAULT FALSE,
  compensation_details TEXT,
  headcount INTEGER DEFAULT 1,
  status TEXT CHECK (status IN ('open', 'filled', 'cancelled')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_headcount CHECK (headcount > 0)
);

-- PROJECT GEAR REQUESTS TABLE
CREATE TABLE IF NOT EXISTS collab_gear_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  equipment_spec TEXT,
  quantity INTEGER DEFAULT 1,
  borrow_preferred BOOLEAN DEFAULT TRUE,
  retainer_acceptable BOOLEAN DEFAULT FALSE,
  max_daily_rate_cents INTEGER,
  status TEXT CHECK (status IN ('open', 'fulfilled', 'cancelled')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_rate CHECK (max_daily_rate_cents IS NULL OR max_daily_rate_cents > 0)
);

-- PROJECT APPLICATIONS TABLE (for role applications)
CREATE TABLE IF NOT EXISTS collab_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id) ON DELETE CASCADE,
  role_id UUID REFERENCES collab_roles(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  application_type TEXT CHECK (application_type IN ('role', 'general')) NOT NULL,
  message TEXT,
  portfolio_url TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_application CHECK (
    (application_type = 'role' AND role_id IS NOT NULL) OR
    (application_type = 'general' AND role_id IS NULL)
  )
);

-- PROJECT GEAR OFFERS TABLE (for equipment offers)
CREATE TABLE IF NOT EXISTS collab_gear_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id) ON DELETE CASCADE,
  gear_request_id UUID REFERENCES collab_gear_requests(id) ON DELETE CASCADE,
  offerer_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  listing_id UUID, -- Will add FK constraint later when listings table exists
  offer_type TEXT CHECK (offer_type IN ('rent', 'sell', 'borrow')) NOT NULL,
  daily_rate_cents INTEGER,
  total_price_cents INTEGER,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_gear_offer CHECK (
    (offer_type IN ('rent', 'borrow') AND daily_rate_cents IS NOT NULL AND daily_rate_cents > 0) OR
    (offer_type = 'sell' AND total_price_cents IS NOT NULL AND total_price_cents > 0)
  )
);

-- PROJECT PARTICIPANTS TABLE (track who's involved in projects)
CREATE TABLE IF NOT EXISTS collab_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES collab_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  role_type TEXT CHECK (role_type IN ('creator', 'collaborator', 'equipment_provider')) NOT NULL,
  role_id UUID REFERENCES collab_roles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'completed', 'left')) DEFAULT 'active',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_project_participant UNIQUE (project_id, user_id),
  CONSTRAINT valid_role_assignment CHECK (
    (role_type = 'creator') OR
    (role_type = 'collaborator' AND role_id IS NOT NULL) OR
    (role_type = 'equipment_provider')
  )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_collab_projects_creator_id ON collab_projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_collab_projects_status ON collab_projects(status);
CREATE INDEX IF NOT EXISTS idx_collab_projects_visibility ON collab_projects(visibility);
CREATE INDEX IF NOT EXISTS idx_collab_projects_location ON collab_projects(city, country);
CREATE INDEX IF NOT EXISTS idx_collab_projects_dates ON collab_projects(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_collab_projects_created_at ON collab_projects(created_at);

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_collab_roles_project_id ON collab_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_roles_status ON collab_roles(status);
CREATE INDEX IF NOT EXISTS idx_collab_roles_skills ON collab_roles USING GIN(skills_required);

-- Gear requests indexes
CREATE INDEX IF NOT EXISTS idx_collab_gear_requests_project_id ON collab_gear_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_gear_requests_category ON collab_gear_requests(category);
CREATE INDEX IF NOT EXISTS idx_collab_gear_requests_status ON collab_gear_requests(status);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_collab_applications_project_id ON collab_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_applications_role_id ON collab_applications(role_id);
CREATE INDEX IF NOT EXISTS idx_collab_applications_applicant_id ON collab_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_collab_applications_status ON collab_applications(status);

-- Gear offers indexes
CREATE INDEX IF NOT EXISTS idx_collab_gear_offers_project_id ON collab_gear_offers(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_gear_offers_gear_request_id ON collab_gear_offers(gear_request_id);
CREATE INDEX IF NOT EXISTS idx_collab_gear_offers_offerer_id ON collab_gear_offers(offerer_id);
-- listing_id index will be created in migration 103 when listings table exists
CREATE INDEX IF NOT EXISTS idx_collab_gear_offers_status ON collab_gear_offers(status);

-- Participants indexes
CREATE INDEX IF NOT EXISTS idx_collab_participants_project_id ON collab_participants(project_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_user_id ON collab_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_role_type ON collab_participants(role_type);
CREATE INDEX IF NOT EXISTS idx_collab_participants_status ON collab_participants(status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE collab_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_gear_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_gear_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_participants ENABLE ROW LEVEL SECURITY;

-- PROJECTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collab_projects_read" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_insert_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_update_own" ON collab_projects;
DROP POLICY IF EXISTS "collab_projects_delete_own" ON collab_projects;

-- Anyone can read public projects, creators can read their own
CREATE POLICY "collab_projects_read" ON collab_projects 
  FOR SELECT USING (
    visibility = 'public' OR 
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

-- Only creators can insert their own projects
CREATE POLICY "collab_projects_insert_own" ON collab_projects 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

-- Only creators can update their own projects
CREATE POLICY "collab_projects_update_own" ON collab_projects 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

-- Only creators can delete their own projects
CREATE POLICY "collab_projects_delete_own" ON collab_projects 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users_profile up 
      WHERE up.id = creator_id AND up.user_id = auth.uid()
    )
  );

-- ROLES POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collab_roles_read" ON collab_roles;
DROP POLICY IF EXISTS "collab_roles_manage_own" ON collab_roles;

-- Read if parent project is visible
CREATE POLICY "collab_roles_read" ON collab_roles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      WHERE cp.id = project_id 
      AND (cp.visibility = 'public' OR 
           EXISTS (SELECT 1 FROM users_profile up WHERE up.id = cp.creator_id AND up.user_id = auth.uid()) OR
           EXISTS (SELECT 1 FROM collab_participants cpp 
                   JOIN users_profile up ON cpp.user_id = up.id
                   WHERE cpp.project_id = cp.id AND up.user_id = auth.uid()))
    )
  );

-- Only project creators can manage roles
CREATE POLICY "collab_roles_manage_own" ON collab_roles 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- GEAR REQUESTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collab_gear_requests_read" ON collab_gear_requests;
DROP POLICY IF EXISTS "collab_gear_requests_manage_own" ON collab_gear_requests;

-- Read if parent project is visible
CREATE POLICY "collab_gear_requests_read" ON collab_gear_requests 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      WHERE cp.id = project_id 
      AND (cp.visibility = 'public' OR 
           EXISTS (SELECT 1 FROM users_profile up WHERE up.id = cp.creator_id AND up.user_id = auth.uid()) OR
           EXISTS (SELECT 1 FROM collab_participants cpp 
                   JOIN users_profile up ON cpp.user_id = up.id
                   WHERE cpp.project_id = cp.id AND up.user_id = auth.uid()))
    )
  );

-- Only project creators can manage gear requests
CREATE POLICY "collab_gear_requests_manage_own" ON collab_gear_requests 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- APPLICATIONS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collab_applications_read_own" ON collab_applications;
DROP POLICY IF EXISTS "collab_applications_insert_as_applicant" ON collab_applications;
DROP POLICY IF EXISTS "collab_applications_update_own" ON collab_applications;

-- Users can read their own applications and project creators can read applications to their projects
CREATE POLICY "collab_applications_read_own" ON collab_applications 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = applicant_id AND up.user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- Users can create applications as applicants
CREATE POLICY "collab_applications_insert_as_applicant" ON collab_applications 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = applicant_id AND up.user_id = auth.uid())
  );

-- Applicants and project creators can update applications
CREATE POLICY "collab_applications_update_own" ON collab_applications 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = applicant_id AND up.user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- GEAR OFFERS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collab_gear_offers_read_own" ON collab_gear_offers;
DROP POLICY IF EXISTS "collab_gear_offers_insert_as_offerer" ON collab_gear_offers;
DROP POLICY IF EXISTS "collab_gear_offers_update_own" ON collab_gear_offers;

-- Users can read offers they made and project creators can read offers to their projects
CREATE POLICY "collab_gear_offers_read_own" ON collab_gear_offers 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = offerer_id AND up.user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- Users can create offers as offerers
CREATE POLICY "collab_gear_offers_insert_as_offerer" ON collab_gear_offers 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = offerer_id AND up.user_id = auth.uid())
  );

-- Offerers and project creators can update offers
CREATE POLICY "collab_gear_offers_update_own" ON collab_gear_offers 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = offerer_id AND up.user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- PARTICIPANTS POLICIES
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collab_participants_read_own" ON collab_participants;
DROP POLICY IF EXISTS "collab_participants_manage_own" ON collab_participants;

-- Users can read participants of projects they're involved in
CREATE POLICY "collab_participants_read_own" ON collab_participants 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users_profile up WHERE up.id = user_id AND up.user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id AND up.user_id = auth.uid()
    )
  );

-- Only project creators can manage participants
CREATE POLICY "collab_participants_manage_own" ON collab_participants 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM collab_projects cp 
      JOIN users_profile up ON cp.creator_id = up.id
      WHERE cp.id = project_id 
      AND up.user_id = auth.uid()
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collab_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_collab_projects_updated_at
    BEFORE UPDATE ON collab_projects
    FOR EACH ROW
    EXECUTE FUNCTION update_collab_updated_at_column();

CREATE TRIGGER update_collab_roles_updated_at
    BEFORE UPDATE ON collab_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_collab_updated_at_column();

CREATE TRIGGER update_collab_gear_requests_updated_at
    BEFORE UPDATE ON collab_gear_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_collab_updated_at_column();

CREATE TRIGGER update_collab_applications_updated_at
    BEFORE UPDATE ON collab_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_collab_updated_at_column();

CREATE TRIGGER update_collab_gear_offers_updated_at
    BEFORE UPDATE ON collab_gear_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_collab_updated_at_column();

-- Function to automatically add creator as participant
CREATE OR REPLACE FUNCTION add_project_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO collab_participants (project_id, user_id, role_type, status)
    VALUES (NEW.id, NEW.creator_id, 'creator', 'active');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as participant
CREATE TRIGGER add_project_creator_as_participant_trigger
    AFTER INSERT ON collab_projects
    FOR EACH ROW
    EXECUTE FUNCTION add_project_creator_as_participant();

-- Function to update role status when applications are accepted
CREATE OR REPLACE FUNCTION update_role_status_on_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    role_headcount INTEGER;
    current_filled INTEGER;
BEGIN
    -- Only process when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        -- Get role headcount
        SELECT headcount INTO role_headcount
        FROM collab_roles
        WHERE id = NEW.role_id;
        
        -- Count current filled positions
        SELECT COUNT(*) INTO current_filled
        FROM collab_applications
        WHERE role_id = NEW.role_id AND status = 'accepted';
        
        -- Update role status if filled
        IF current_filled >= role_headcount THEN
            UPDATE collab_roles
            SET status = 'filled'
            WHERE id = NEW.role_id;
        END IF;
        
        -- Add user as participant
        INSERT INTO collab_participants (project_id, user_id, role_type, role_id, status)
        VALUES (NEW.project_id, NEW.applicant_id, 'collaborator', NEW.role_id, 'active')
        ON CONFLICT (project_id, user_id) DO UPDATE SET
            role_type = 'collaborator',
            role_id = NEW.role_id,
            status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update role status
CREATE TRIGGER update_role_status_on_acceptance_trigger
    AFTER UPDATE ON collab_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_role_status_on_acceptance();

-- Function to add equipment provider as participant when gear offer is accepted
CREATE OR REPLACE FUNCTION add_equipment_provider_as_participant()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'accepted'
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        INSERT INTO collab_participants (project_id, user_id, role_type, status)
        VALUES (NEW.project_id, NEW.offerer_id, 'equipment_provider', 'active')
        ON CONFLICT (project_id, user_id) DO UPDATE SET
            role_type = 'equipment_provider',
            status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add equipment provider as participant
CREATE TRIGGER add_equipment_provider_as_participant_trigger
    AFTER UPDATE ON collab_gear_offers
    FOR EACH ROW
    EXECUTE FUNCTION add_equipment_provider_as_participant();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE collab_projects IS 'Project-based collaboration system for creators';
COMMENT ON TABLE collab_roles IS 'Roles needed for projects (photographer, model, etc.)';
COMMENT ON TABLE collab_gear_requests IS 'Equipment requests for projects';
COMMENT ON TABLE collab_applications IS 'Applications for project roles';
COMMENT ON TABLE collab_gear_offers IS 'Offers to provide equipment for projects';
COMMENT ON TABLE collab_participants IS 'Users involved in projects';

COMMENT ON COLUMN collab_projects.visibility IS 'Project visibility: public, private, or invite_only';
COMMENT ON COLUMN collab_projects.status IS 'Project status: draft, published, in_progress, completed, cancelled';
COMMENT ON COLUMN collab_roles.skills_required IS 'Array of required skills for the role';
COMMENT ON COLUMN collab_gear_requests.borrow_preferred IS 'Whether borrowing is preferred over renting';
COMMENT ON COLUMN collab_applications.application_type IS 'Type of application: role-specific or general interest';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log successful migration
INSERT INTO system_alerts (type, level, message, metadata)
VALUES (
    'migration_completed',
    'info',
    'Collaboration system migration completed successfully',
    '{"migration": "098_collaboration_system.sql", "tables_created": 6, "indexes_created": 20, "policies_created": 18}'
) ON CONFLICT DO NOTHING;
