-- Safe Schema Update
-- This script only adds missing elements without recreating existing tables

-- Create missing enum types (only if they don't exist)
DO $$ 
BEGIN
    -- User role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('CONTRIBUTOR', 'TALENT', 'ADMIN');
    END IF;
    
    -- Subscription tier enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('FREE', 'PLUS', 'PRO');
    END IF;
    
    -- Subscription status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL');
    END IF;
    
    -- Gig status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gig_status') THEN
        CREATE TYPE gig_status AS ENUM ('DRAFT', 'PUBLISHED', 'APPLICATIONS_CLOSED', 'BOOKED', 'COMPLETED', 'CANCELLED');
    END IF;
    
    -- Compensation type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compensation_type') THEN
        CREATE TYPE compensation_type AS ENUM ('TFP', 'PAID', 'EXPENSES');
    END IF;
    
    -- Application status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');
    END IF;
    
    -- Showcase visibility enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'showcase_visibility') THEN
        CREATE TYPE showcase_visibility AS ENUM ('DRAFT', 'PUBLIC', 'PRIVATE');
    END IF;
    
    -- Media type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'PDF');
    END IF;
    
    -- Gig purpose enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gig_purpose') THEN
        CREATE TYPE gig_purpose AS ENUM (
            'PORTFOLIO',
            'COMMERCIAL',
            'EDITORIAL',
            'FASHION',
            'BEAUTY',
            'LIFESTYLE',
            'WEDDING',
            'EVENT',
            'PRODUCT',
            'ARCHITECTURE',
            'STREET',
            'CONCEPTUAL',
            'OTHER'
        );
    END IF;
    
    -- Verification status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'EMAIL_VERIFIED', 'ID_VERIFIED');
    END IF;
END $$;

-- Create missing tables (only if they don't exist)
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    note TEXT,
    status application_status DEFAULT 'PENDING',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gig_id, applicant_user_id)
);

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    type media_type NOT NULL,
    bucket VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    palette JSONB,
    blurhash VARCHAR(255),
    exif_json JSONB,
    ai_metadata JSONB,
    visibility showcase_visibility DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moodboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT,
    palette JSONB,
    items JSONB NOT NULL DEFAULT '[]',
    vibe_ids UUID[] DEFAULT '{}',
    vibe_summary TEXT,
    mood_descriptors TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    ai_analysis_status VARCHAR(50) DEFAULT 'pending',
    ai_analyzed_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false,
    source_breakdown JSONB DEFAULT '{
      "pexels": 0,
      "user_uploads": 0,
      "ai_enhanced": 0,
      "ai_generated": 0
    }',
    enhancement_log JSONB DEFAULT '[]',
    total_cost DECIMAL(10,4) DEFAULT 0,
    generated_prompts TEXT[] DEFAULT '{}',
    ai_provider VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS showcases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    talent_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    media_ids UUID[] NOT NULL,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    palette JSONB,
    approved_by_creator_at TIMESTAMPTZ,
    approved_by_talent_at TIMESTAMPTZ,
    visibility showcase_visibility DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT media_count CHECK (array_length(media_ids, 1) BETWEEN 3 AND 6)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    conversation_id UUID,
    status VARCHAR(50) DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    reviewed_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    tags TEXT[] DEFAULT '{}',
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gig_id, reviewer_user_id, reviewed_user_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_content_id UUID,
    content_type TEXT CHECK (content_type IN ('user', 'gig', 'showcase', 'message', 'image', 'moodboard')) NOT NULL,
    reason TEXT CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'scam', 'copyright', 'other', 'underage', 'safety')) NOT NULL,
    description TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolution_action TEXT CHECK (resolution_action IN ('warning', 'content_removed', 'user_suspended', 'user_banned', 'dismissed', 'no_action')),
    evidence_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    CONSTRAINT valid_content_reference CHECK (
        (content_type = 'user' AND reported_user_id IS NOT NULL) OR
        (content_type != 'user' AND reported_content_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    tier subscription_tier NOT NULL,
    status subscription_status NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier VARCHAR(20) NOT NULL,
    monthly_allowance INTEGER DEFAULT 0,
    current_balance INTEGER DEFAULT 0,
    consumed_this_month INTEGER DEFAULT 0,
    last_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
    lifetime_consumed INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    allow_stranger_messages BOOLEAN DEFAULT false,
    privacy_level VARCHAR(20) DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(profile_id)
);

-- Create missing functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'TALENT'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create missing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add update triggers to existing tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_users_profile_updated_at ON users_profile;
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_gigs_updated_at ON gigs;
CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_users_profile_handle ON users_profile(handle);
CREATE INDEX IF NOT EXISTS idx_gigs_owner ON gigs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);

-- Verify the schema
SELECT 'Schema update completed successfully' as status;
