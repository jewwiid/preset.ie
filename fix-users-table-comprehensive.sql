-- Comprehensive fix for users table and user_role enum
-- This addresses both the enum values and foreign key constraint issues

-- Step 1: Fix user_role enum
DO $$
DECLARE
    enum_exists BOOLEAN;
    user_value_exists BOOLEAN;
    admin_value_exists BOOLEAN;
    moderator_value_exists BOOLEAN;
BEGIN
    -- Check if user_role enum exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'user_role'
    ) INTO enum_exists;
    
    IF NOT enum_exists THEN
        -- Create the enum if it doesn't exist
        CREATE TYPE user_role AS ENUM ('USER', 'ADMIN', 'MODERATOR');
        RAISE NOTICE 'Created user_role enum with values: USER, ADMIN, MODERATOR';
    ELSE
        -- Check if USER value exists
        SELECT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'USER'
        ) INTO user_value_exists;
        
        -- Check if ADMIN value exists
        SELECT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'ADMIN'
        ) INTO admin_value_exists;
        
        -- Check if MODERATOR value exists
        SELECT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'MODERATOR'
        ) INTO moderator_value_exists;
        
        IF NOT user_value_exists THEN
            ALTER TYPE user_role ADD VALUE 'USER';
            RAISE NOTICE 'Added USER value to user_role enum';
        ELSE
            RAISE NOTICE 'USER value already exists in user_role enum';
        END IF;
        
        IF NOT admin_value_exists THEN
            ALTER TYPE user_role ADD VALUE 'ADMIN';
            RAISE NOTICE 'Added ADMIN value to user_role enum';
        ELSE
            RAISE NOTICE 'ADMIN value already exists in user_role enum';
        END IF;
        
        IF NOT moderator_value_exists THEN
            ALTER TYPE user_role ADD VALUE 'MODERATOR';
            RAISE NOTICE 'Added MODERATOR value to user_role enum';
        ELSE
            RAISE NOTICE 'MODERATOR value already exists in user_role enum';
        END IF;
    END IF;
END $$;

-- Step 2: Check and fix users table structure
DO $$
DECLARE
    table_exists BOOLEAN;
    id_column_type TEXT;
    foreign_key_exists BOOLEAN;
BEGIN
    -- Check if users table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create users table if it doesn't exist
        CREATE TABLE users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT NOT NULL UNIQUE,
            role user_role DEFAULT 'USER',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created users table';
    ELSE
        -- Check if id column has the correct foreign key constraint
        SELECT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'users' 
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'id'
            AND tc.table_schema = 'public'
        ) INTO foreign_key_exists;
        
        IF NOT foreign_key_exists THEN
            -- Add foreign key constraint if it doesn't exist
            ALTER TABLE users ADD CONSTRAINT users_id_fkey 
            FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint to users.id';
        ELSE
            RAISE NOTICE 'Foreign key constraint already exists on users.id';
        END IF;
        
        -- Check if role column exists and has correct type
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'role' 
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE users ADD COLUMN role user_role DEFAULT 'USER';
            RAISE NOTICE 'Added role column to users table';
        ELSE
            RAISE NOTICE 'Role column already exists in users table';
        END IF;
        
        -- Check if email column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'email' 
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE users ADD COLUMN email TEXT NOT NULL UNIQUE;
            RAISE NOTICE 'Added email column to users table';
        ELSE
            RAISE NOTICE 'Email column already exists in users table';
        END IF;
    END IF;
END $$;

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 4: Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
DO $$
BEGIN
    -- Policy for users to see their own record
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view own record'
    ) THEN
        CREATE POLICY "Users can view own record" ON users
            FOR SELECT USING (auth.uid() = id);
        RAISE NOTICE 'Created RLS policy: Users can view own record';
    END IF;
    
    -- Policy for users to update their own record
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can update own record'
    ) THEN
        CREATE POLICY "Users can update own record" ON users
            FOR UPDATE USING (auth.uid() = id);
        RAISE NOTICE 'Created RLS policy: Users can update own record';
    END IF;
    
    -- Policy for service role to insert users
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Service role can insert users'
    ) THEN
        CREATE POLICY "Service role can insert users" ON users
            FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created RLS policy: Service role can insert users';
    END IF;
END $$;

-- Step 6: Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Step 7: Verify the enum values
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

SELECT 'Users table and user_role enum fixed successfully!' as status;
