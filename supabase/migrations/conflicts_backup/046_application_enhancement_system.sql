-- Application Enhancement System Migration
-- This migration adds comprehensive tables to enhance the gig application experience
-- Focuses on portfolio attachments, messaging, status tracking, availability, and feedback

-- Create additional enum types for the new system
CREATE TYPE attachment_type AS ENUM ('portfolio', 'resume', 'reference', 'document', 'other');
CREATE TYPE requirement_type AS ENUM ('skill', 'equipment', 'experience', 'software', 'certification');
CREATE TYPE skill_type AS ENUM ('technical', 'creative', 'equipment', 'software', 'interpersonal');
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE feedback_type AS ENUM ('rejection', 'selection', 'general', 'improvement');

-- 1. APPLICATION_ATTACHMENTS - Portfolio & Document Uploads
-- Allows users to attach portfolio pieces, resumes, and references to applications
CREATE TABLE application_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL DEFAULT 'portfolio',
    title VARCHAR(255),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false, -- Highlight key pieces
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLICATION_MESSAGES - Direct Communication
-- Enables direct messaging between applicants and gig owners
CREATE TABLE application_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    message_type VARCHAR(20) DEFAULT 'message', -- 'message', 'question', 'clarification'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPLICATION_STATUS_HISTORY - Application Journey Tracking
-- Tracks all status changes with timestamps and reasons
CREATE TABLE application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status application_status,
    new_status application_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users_profile(id),
    reason TEXT, -- Optional reason for status change
    notes TEXT, -- Additional notes
    automated BOOLEAN DEFAULT false, -- Track if change was automated
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER_AVAILABILITY - Scheduling & Calendar
-- Allows users to specify when they're available for shoots
CREATE TABLE user_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    available_from TIMESTAMPTZ NOT NULL,
    available_until TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB, -- For weekly/monthly patterns
    is_blocked BOOLEAN DEFAULT false, -- For blocking out unavailable times
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPLICATION_FEEDBACK - Learning & Improvement
-- Provides feedback to help users improve future applications
CREATE TABLE application_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    feedback_type feedback_type NOT NULL DEFAULT 'general',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    is_public BOOLEAN DEFAULT false,
    is_constructive BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GIG_REQUIREMENTS - Skills & Equipment Matching
-- Defines specific requirements for gigs
CREATE TABLE gig_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    requirement_type requirement_type NOT NULL,
    requirement_name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT true,
    description TEXT,
    minimum_experience INTEGER, -- Minimum years if applicable
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. USER_SKILLS - Profile Enhancement
-- Allows users to showcase specific skills and equipment
CREATE TABLE user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    skill_type skill_type NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level proficiency_level DEFAULT 'intermediate',
    years_experience INTEGER,
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users_profile(id),
    verified_at TIMESTAMPTZ,
    description TEXT, -- Additional details about the skill
    is_featured BOOLEAN DEFAULT false, -- Show prominently on profile
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. APPLICATION_VIEWS - Track application engagement
-- Tracks when gig owners view applications
CREATE TABLE application_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    viewed_by UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    view_duration INTEGER, -- Seconds spent viewing
    UNIQUE(application_id, viewed_by, DATE(viewed_at)) -- One view per day per user
);

-- Create indexes for better query performance
CREATE INDEX idx_application_attachments_application_id ON application_attachments(application_id);
CREATE INDEX idx_application_attachments_media_id ON application_attachments(media_id);
CREATE INDEX idx_application_attachments_type ON application_attachments(attachment_type);

CREATE INDEX idx_application_messages_application_id ON application_messages(application_id);
CREATE INDEX idx_application_messages_from_user ON application_messages(from_user_id);
CREATE INDEX idx_application_messages_to_user ON application_messages(to_user_id);
CREATE INDEX idx_application_messages_created_at ON application_messages(created_at);

CREATE INDEX idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX idx_application_status_history_created_at ON application_status_history(created_at);

CREATE INDEX idx_user_availability_user_id ON user_availability(user_id);
CREATE INDEX idx_user_availability_dates ON user_availability(available_from, available_until);

CREATE INDEX idx_application_feedback_application_id ON application_feedback(application_id);
CREATE INDEX idx_application_feedback_rating ON application_feedback(rating);

CREATE INDEX idx_gig_requirements_gig_id ON gig_requirements(gig_id);
CREATE INDEX idx_gig_requirements_type ON gig_requirements(requirement_type);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_type ON user_skills(skill_type);
CREATE INDEX idx_user_skills_name ON user_skills(skill_name);

CREATE INDEX idx_application_views_application_id ON application_views(application_id);
CREATE INDEX idx_application_views_viewed_by ON application_views(viewed_by);

-- Add RLS (Row Level Security) policies
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_views ENABLE ROW LEVEL SECURITY;

-- APPLICATION_ATTACHMENTS policies
CREATE POLICY "Users can view their own application attachments" ON application_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a 
            JOIN users_profile up ON a.applicant_user_id = up.id 
            WHERE a.id = application_id AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Gig owners can view application attachments" ON application_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a 
            JOIN gigs g ON a.gig_id = g.id 
            JOIN users_profile up ON g.owner_user_id = up.id 
            WHERE a.id = application_id AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own application attachments" ON application_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM applications a 
            JOIN users_profile up ON a.applicant_user_id = up.id 
            WHERE a.id = application_id AND up.user_id = auth.uid()
        )
    );

-- APPLICATION_MESSAGES policies
CREATE POLICY "Users can view their messages" ON application_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE (up.id = from_user_id OR up.id = to_user_id) AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON application_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE up.id = from_user_id AND up.user_id = auth.uid()
        )
    );

-- APPLICATION_STATUS_HISTORY policies
CREATE POLICY "Users can view their application history" ON application_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a 
            JOIN users_profile up ON a.applicant_user_id = up.id 
            WHERE a.id = application_id AND up.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM applications a 
            JOIN gigs g ON a.gig_id = g.id 
            JOIN users_profile up ON g.owner_user_id = up.id 
            WHERE a.id = application_id AND up.user_id = auth.uid()
        )
    );

-- USER_AVAILABILITY policies
CREATE POLICY "Users can manage their own availability" ON user_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE up.id = user_id AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view user availability" ON user_availability
    FOR SELECT USING (true);

-- APPLICATION_FEEDBACK policies
CREATE POLICY "Users can view feedback about their applications" ON application_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE (up.id = from_user_id OR up.id = to_user_id) AND up.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can give feedback" ON application_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE up.id = from_user_id AND up.user_id = auth.uid()
        )
    );

-- GIG_REQUIREMENTS policies
CREATE POLICY "Public can view gig requirements" ON gig_requirements
    FOR SELECT USING (true);

CREATE POLICY "Gig owners can manage requirements" ON gig_requirements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gigs g 
            JOIN users_profile up ON g.owner_user_id = up.id 
            WHERE g.id = gig_id AND up.user_id = auth.uid()
        )
    );

-- USER_SKILLS policies
CREATE POLICY "Public can view user skills" ON user_skills
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own skills" ON user_skills
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE up.id = user_id AND up.user_id = auth.uid()
        )
    );

-- APPLICATION_VIEWS policies
CREATE POLICY "Gig owners can view application views" ON application_views
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM applications a 
            JOIN gigs g ON a.gig_id = g.id 
            JOIN users_profile up ON g.owner_user_id = up.id 
            WHERE a.id = application_id AND up.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users_profile up 
            WHERE up.id = viewed_by AND up.user_id = auth.uid()
        )
    );

-- Add helpful functions
CREATE OR REPLACE FUNCTION get_application_attachment_count(app_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM application_attachments 
        WHERE application_id = app_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_unread_message_count(app_id UUID, user_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM application_messages 
        WHERE application_id = app_id 
        AND to_user_id = user_profile_id 
        AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_application_attachments_updated_at 
    BEFORE UPDATE ON application_attachments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_availability_updated_at 
    BEFORE UPDATE ON user_availability 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at 
    BEFORE UPDATE ON user_skills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE application_attachments IS 'Stores portfolio pieces, resumes, and documents attached to applications';
COMMENT ON TABLE application_messages IS 'Direct messaging between applicants and gig owners for specific applications';
COMMENT ON TABLE application_status_history IS 'Tracks all status changes for applications with timestamps and reasons';
COMMENT ON TABLE user_availability IS 'User availability schedules for shoot planning';
COMMENT ON TABLE application_feedback IS 'Feedback system to help users improve their applications';
COMMENT ON TABLE gig_requirements IS 'Specific skills, equipment, and experience requirements for gigs';
COMMENT ON TABLE user_skills IS 'User skill profiles for better matching with gig requirements';
COMMENT ON TABLE application_views IS 'Tracks when gig owners view applications for analytics';

-- Insert some sample data for common skills and requirements
INSERT INTO gig_requirements (gig_id, requirement_type, requirement_name, is_required, description) 
SELECT g.id, 'equipment', 'Digital Camera', true, 'DSLR or mirrorless camera required'
FROM gigs g WHERE g.title ILIKE '%portrait%' LIMIT 1;

-- Add common skills that users might have
-- These can be referenced when users build their profiles
CREATE TABLE skill_suggestions (
    id SERIAL PRIMARY KEY,
    skill_type skill_type NOT NULL,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_equipment BOOLEAN DEFAULT false,
    popularity_score INTEGER DEFAULT 0
);

INSERT INTO skill_suggestions (skill_type, skill_name, description, is_equipment) VALUES
-- Technical Skills
('technical', 'Portrait Photography', 'Expertise in portrait photography techniques', false),
('technical', 'Landscape Photography', 'Specialized in outdoor and landscape photography', false),
('technical', 'Studio Lighting', 'Proficient with studio lighting setups', false),
('technical', 'Natural Light Photography', 'Expert in utilizing natural lighting conditions', false),
('technical', 'Photo Retouching', 'Advanced photo editing and retouching skills', false),
('technical', 'Color Grading', 'Professional color correction and grading', false),

-- Equipment
('equipment', 'Canon DSLR', 'Canon digital cameras', true),
('equipment', 'Nikon DSLR', 'Nikon digital cameras', true),
('equipment', 'Sony Mirrorless', 'Sony mirrorless camera systems', true),
('equipment', 'Professional Lighting Kit', 'Studio lighting equipment', true),
('equipment', 'Drone', 'Aerial photography equipment', true),
('equipment', 'Medium Format Camera', 'High-end medium format systems', true),

-- Software
('software', 'Adobe Photoshop', 'Industry standard photo editing software', false),
('software', 'Adobe Lightroom', 'Photo organization and basic editing', false),
('software', 'Capture One', 'Professional RAW processing software', false),
('software', 'Final Cut Pro', 'Video editing for multimedia projects', false),

-- Creative
('creative', 'Art Direction', 'Creative vision and direction for shoots', false),
('creative', 'Styling', 'Fashion and prop styling expertise', false),
('creative', 'Concept Development', 'Creative ideation and concept creation', false);

COMMENT ON TABLE skill_suggestions IS 'Predefined skill suggestions to help users build comprehensive profiles';

-- Final summary
SELECT 
    'application_attachments' as table_name, count(*) as row_count FROM application_attachments
UNION ALL
SELECT 'application_messages', count(*) FROM application_messages
UNION ALL  
SELECT 'application_status_history', count(*) FROM application_status_history
UNION ALL
SELECT 'user_availability', count(*) FROM user_availability
UNION ALL
SELECT 'application_feedback', count(*) FROM application_feedback
UNION ALL
SELECT 'gig_requirements', count(*) FROM gig_requirements  
UNION ALL
SELECT 'user_skills', count(*) FROM user_skills
UNION ALL
SELECT 'application_views', count(*) FROM application_views
UNION ALL
SELECT 'skill_suggestions', count(*) FROM skill_suggestions;