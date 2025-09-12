-- Simplified Application Enhancement System Migration
-- This creates just the core tables needed for enhanced gig applications

-- Create additional enum types
DO $$ BEGIN
    CREATE TYPE attachment_type AS ENUM ('portfolio', 'resume', 'reference', 'document', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE requirement_type AS ENUM ('skill', 'equipment', 'experience', 'software', 'certification');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_type AS ENUM ('technical', 'creative', 'equipment', 'software', 'interpersonal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_type AS ENUM ('rejection', 'selection', 'general', 'improvement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. APPLICATION_ATTACHMENTS - Portfolio & Document Uploads
CREATE TABLE IF NOT EXISTS application_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    attachment_type attachment_type NOT NULL DEFAULT 'portfolio',
    title VARCHAR(255),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLICATION_MESSAGES - Direct Communication
CREATE TABLE IF NOT EXISTS application_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    message_type VARCHAR(20) DEFAULT 'message',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPLICATION_STATUS_HISTORY - Application Journey Tracking
CREATE TABLE IF NOT EXISTS application_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    previous_status application_status,
    new_status application_status NOT NULL,
    changed_by UUID NOT NULL REFERENCES users_profile(id),
    reason TEXT,
    notes TEXT,
    automated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USER_AVAILABILITY - Scheduling & Calendar
CREATE TABLE IF NOT EXISTS user_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    available_from TIMESTAMPTZ NOT NULL,
    available_until TIMESTAMPTZ NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern JSONB,
    is_blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPLICATION_FEEDBACK - Learning & Improvement
CREATE TABLE IF NOT EXISTS application_feedback (
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

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_application_attachments_application_id ON application_attachments(application_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_application_id ON application_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_application_status_history_application_id ON application_status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_user_availability_user_id ON user_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_application_feedback_application_id ON application_feedback(application_id);

-- Enable RLS
ALTER TABLE application_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_feedback ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
DO $$ BEGIN
    CREATE POLICY "Users can view their own application attachments" ON application_attachments
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM applications a 
                JOIN users_profile up ON a.applicant_user_id = up.id 
                WHERE a.id = application_id AND up.user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own availability" ON user_availability
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM users_profile up 
                WHERE up.id = user_id AND up.user_id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add comments
COMMENT ON TABLE application_attachments IS 'Portfolio pieces, resumes, and documents attached to applications';
COMMENT ON TABLE application_messages IS 'Direct messaging between applicants and gig owners';
COMMENT ON TABLE application_status_history IS 'Tracks all status changes for applications';
COMMENT ON TABLE user_availability IS 'User availability schedules for shoot planning';
COMMENT ON TABLE application_feedback IS 'Feedback to help users improve applications';