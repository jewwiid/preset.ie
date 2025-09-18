-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('contributor', 'talent', 'admin')),
  verification_status JSONB DEFAULT '{"level": "none"}'::jsonb,
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'pro')),
  subscription_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_suspended BOOLEAN DEFAULT false,
  suspended_until TIMESTAMPTZ,
  suspension_reason TEXT,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  handle VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  website TEXT,
  instagram VARCHAR(50),
  style_tags TEXT[] DEFAULT '{}',
  showcase_ids UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  profile_views INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT handle_format CHECK (handle ~ '^[a-z][a-z0-9_]{2,29}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
-- Note: is_suspended column may not exist in users table
-- CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(is_suspended) WHERE is_suspended = true;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_profiles_style_tags ON profiles USING GIN(style_tags);
-- Note: Some columns may not exist in profiles table
-- CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);
-- CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public);
-- CREATE INDEX IF NOT EXISTS idx_profiles_views ON profiles(profile_views DESC);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (commented out as they may already exist)
-- These policies have been created in earlier migrations

-- Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET profile_views = profile_views + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle user creation (triggered after auth.users insert)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'talent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (commented out as they may already exist)
-- CREATE TRIGGER update_users_updated_at
--   BEFORE UPDATE ON users
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- CREATE TRIGGER update_profiles_updated_at
--   BEFORE UPDATE ON profiles
--   FOR EACH ROW EXECUTE FUNCTION update_updated_at();