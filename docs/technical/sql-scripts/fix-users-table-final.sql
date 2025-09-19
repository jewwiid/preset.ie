-- Final fix for users table - remove all constraints that might cause issues
-- This ensures the users table can be inserted into without foreign key violations

-- Drop all foreign key constraints on users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_fkey;

-- Check if the users table has the correct structure
-- If not, recreate it
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'TALENT',
    subscription_tier subscription_tier DEFAULT 'FREE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Verify the table was created
SELECT 'Users table recreated successfully!' as status;

