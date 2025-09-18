-- Migration: Create users and profiles tables for Identity & Access context
-- Description: Core user authentication and profile management with subscription tiers

-- Create subscription_tier enum if not exists
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('FREE', 'PLUS', 'PRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create verification_status enum if not exists
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('UNVERIFIED', 'EMAIL_VERIFIED', 'ID_VERIFIED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CONTRIBUTOR', 'TALENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create users table (extends Supabase auth.users)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_profiles_style_tags ON profiles USING GIN(style_tags);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own user record"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own user record"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role has full access to users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for profiles table
CREATE POLICY "Profiles are publicly readable"
  ON profiles
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role has full access to profiles"
  ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to handle user signup
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

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE users IS 'Core user table extending Supabase auth with subscription and verification';
COMMENT ON TABLE profiles IS 'User profiles with display information and preferences';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level: FREE, PLUS, or PRO';
COMMENT ON COLUMN users.verification_status IS 'User verification level for trust and safety';
COMMENT ON COLUMN profiles.handle IS 'Unique username for profile URL (lowercase, alphanumeric, underscore)';
COMMENT ON COLUMN profiles.style_tags IS 'Array of style/aesthetic tags for matching';
COMMENT ON COLUMN profiles.showcase_ids IS 'Array of showcase IDs linked to this profile';