-- Fix user_role enum to include all required values
-- This ensures the enum has the correct values for user creation

-- First, check if the enum exists and what values it has
DO $$
DECLARE
    enum_exists BOOLEAN;
    user_value_exists BOOLEAN;
    admin_value_exists BOOLEAN;
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
        
        -- Check if MODERATOR value exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'user_role' AND e.enumlabel = 'MODERATOR'
        ) THEN
            ALTER TYPE user_role ADD VALUE 'MODERATOR';
            RAISE NOTICE 'Added MODERATOR value to user_role enum';
        ELSE
            RAISE NOTICE 'MODERATOR value already exists in user_role enum';
        END IF;
    END IF;
END $$;

-- Verify the enum values
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

SELECT 'user_role enum fixed successfully!' as status;
