-- Complete migration with conditional type creation
-- This will create types only if they don't exist, then create all tables

-- Create types with IF NOT EXISTS (PostgreSQL doesn't support this directly, so we'll use DO blocks)

-- Create user_role type (might already exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CONTRIBUTOR', 'TALENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create subscription_tier type
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('FREE', 'PLUS', 'PRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create subscription_status type
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create gig_status type
DO $$ BEGIN
    CREATE TYPE gig_status AS ENUM ('DRAFT', 'PUBLISHED', 'APPLICATIONS_CLOSED', 'BOOKED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create compensation_type type
DO $$ BEGIN
    CREATE TYPE compensation_type AS ENUM ('TFP', 'PAID', 'EXPENSES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create application_status type
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('PENDING', 'SHORTLISTED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create showcase_visibility type
DO $$ BEGIN
    CREATE TYPE showcase_visibility AS ENUM ('DRAFT', 'PUBLIC', 'PRIVATE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create media_type type
DO $$ BEGIN
    CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'PDF');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Now create all tables
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

CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE SET NULL,
    type media_type NOT NULL,
    bucket VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    palette JSONB,
    blurhash VARCHAR(255),
    exif_json JSONB,
    visibility showcase_visibility DEFAULT 'PRIVATE',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE moodboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    owner_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    title VARCHAR(255),
    summary TEXT,
    palette JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE moodboard_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    external_url TEXT,
    title VARCHAR(255),
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT has_media_or_url CHECK (
        (media_id IS NOT NULL AND external_url IS NULL) OR 
        (media_id IS NULL AND external_url IS NOT NULL)
    )
);

CREATE TABLE showcases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
    creator_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    talent_user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    caption TEXT,
    tags TEXT[] DEFAULT '{}',
    palette JSONB,
    approved_by_creator_at TIMESTAMPTZ,
    approved_by_talent_at TIMESTAMPTZ,
    visibility showcase_visibility DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE showcase_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(showcase_id, media_id)
);

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_handle ON users_profile(handle);
CREATE INDEX IF NOT EXISTS idx_users_profile_user_id ON users_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_owner ON gigs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gigs_location ON gigs USING GIST(location) WHERE location IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_applications_gig ON applications(gig_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_gig ON media(gig_id);
CREATE INDEX IF NOT EXISTS idx_moodboard_items_moodboard ON moodboard_items(moodboard_id);
CREATE INDEX IF NOT EXISTS idx_showcase_media_showcase ON showcase_media(showcase_id);
CREATE INDEX IF NOT EXISTS idx_messages_gig ON messages(gig_id);
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_gig ON reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);