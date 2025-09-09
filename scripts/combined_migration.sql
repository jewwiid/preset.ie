
-- Combined migration for Phase 1 & 2
-- Run this in Supabase SQL Editor


-- Create domain_events table if not exists
CREATE TABLE IF NOT EXISTS domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_version INTEGER DEFAULT 1,
  payload JSONB NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_domain_events_aggregate_id') THEN
    CREATE INDEX idx_domain_events_aggregate_id ON domain_events(aggregate_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_domain_events_event_type') THEN
    CREATE INDEX idx_domain_events_event_type ON domain_events(event_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_domain_events_occurred_at') THEN
    CREATE INDEX idx_domain_events_occurred_at ON domain_events(occurred_at DESC);
  END IF;
END $$;



-- Create enums if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('FREE', 'PLUS', 'PRO');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'EMAIL_VERIFIED', 'ID_VERIFIED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('CONTRIBUTOR', 'TALENT', 'ADMIN');
  END IF;
END $$;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'TALENT',
  subscription_tier subscription_tier NOT NULL DEFAULT 'FREE',
  subscription_expires_at TIMESTAMPTZ,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  verification_status verification_status NOT NULL DEFAULT 'UNVERIFIED',
  email_verified_at TIMESTAMPTZ,
  id_verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city VARCHAR(100),
  style_tags TEXT[] DEFAULT '{}',
  showcase_ids TEXT[] DEFAULT '{}',
  website_url TEXT,
  instagram_handle VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_]{3,50}$')
);

-- Create indexes if not exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON users(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_user_id') THEN
    CREATE INDEX idx_profiles_user_id ON profiles(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_handle') THEN
    CREATE INDEX idx_profiles_handle ON profiles(handle);
  END IF;
END $$;


-- Enable RLS
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Service role full access to domain_events"
  ON domain_events FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Users can read own user record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Profiles are publicly readable"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can manage own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  