-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom types
CREATE TYPE user_role AS ENUM ('CONTRIBUTOR', 'TALENT', 'ADMIN');
CREATE TYPE subscription_tier AS ENUM ('FREE', 'PLUS', 'PRO');
CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL');
CREATE TYPE gig_status AS ENUM ('DRAFT', 'PUBLISHED', 'APPLICATIONS_CLOSED', 'BOOKED', 'COMPLETED', 'CANCELLED');
CREATE TYPE compensation_type AS ENUM ('TFP', 'PAID', 'EXPENSES');
CREATE TYPE application_status AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');
CREATE TYPE showcase_visibility AS ENUM ('DRAFT', 'PUBLIC', 'PRIVATE');
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'PDF');

-- Users profile table
CREATE TABLE users_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    handle VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    city VARCHAR(255),
    role_flags user_role[] DEFAULT '{}',
    style_tags TEXT[] DEFAULT '{}',
    subscription_tier subscription_tier DEFAULT 'FREE',
    subscription_status subscription_status DEFAULT 'ACTIVE',
    subscription_started_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_expires_at TIMESTAMPTZ,
    verified_id BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_]+$')
);

-- Gigs table
CREATE TABLE gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    comp_type compensation_type NOT NULL,
    comp_details TEXT,
    location_text VARCHAR(255) NOT NULL,
    location GEOGRAPHY(POINT),
    radius_meters INTEGER,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    application_deadline TIMESTAMPTZ NOT NULL,
    max_applicants INTEGER NOT NULL DEFAULT 20,
    usage_rights TEXT NOT NULL,
    safety_notes TEXT,
    status gig_status DEFAULT 'DRAFT',
    boost_level INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_deadline CHECK (application_deadline <= start_time),
    CONSTRAINT valid_boost CHECK (boost_level >= 0)
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    applicant_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    note TEXT,
    status application_status DEFAULT 'PENDING',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(gig_id, applicant_user_id)
);

-- Media table
CREATE TABLE media (
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
    visibility showcase_visibility DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moodboards table
CREATE TABLE moodboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT,
    palette JSONB,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Showcases table
CREATE TABLE showcases (
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

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Reviews table
CREATE TABLE reviews (
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

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    reported_gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    reported_showcase_id UUID REFERENCES showcases(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    details TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table (for Stripe integration)
CREATE TABLE subscriptions (
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

-- Indexes for performance
CREATE INDEX idx_gigs_owner ON gigs(owner_user_id);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_location ON gigs USING GIST(location);
CREATE INDEX idx_gigs_dates ON gigs(start_time, end_time);
CREATE INDEX idx_applications_gig ON applications(gig_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_user_id);
CREATE INDEX idx_showcases_creator ON showcases(creator_user_id);
CREATE INDEX idx_showcases_talent ON showcases(talent_user_id);
CREATE INDEX idx_messages_gig ON messages(gig_id);
CREATE INDEX idx_messages_users ON messages(from_user_id, to_user_id);
CREATE INDEX idx_media_owner ON media(owner_user_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_profile_updated_at BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_moodboards_updated_at BEFORE UPDATE ON moodboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_showcases_updated_at BEFORE UPDATE ON showcases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();