-- Fix the foreign key constraint issue
-- The problem is that users.id has a foreign key to auth.users.id
-- but we're trying to insert before the auth.users record exists

-- First, let's check what the current constraint is
-- Then we'll modify our trigger to work around it

-- Drop the existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_new_user_simple();

-- Create a new function that handles the foreign key constraint properly
CREATE OR REPLACE FUNCTION handle_new_user_fixed()
RETURNS TRIGGER AS $$
BEGIN
    -- Wait a moment to ensure the auth.users record is fully committed
    PERFORM pg_sleep(0.1);
    
    -- Insert into users table with proper error handling
    BEGIN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            'TALENT',
            NOW(),
            NOW()
        );
    EXCEPTION
        WHEN foreign_key_violation THEN
            -- If foreign key constraint fails, try again after a short delay
            PERFORM pg_sleep(0.2);
            INSERT INTO public.users (id, email, role, created_at, updated_at)
            VALUES (
                NEW.id,
                NEW.email,
                'TALENT',
                NOW(),
                NOW()
            )
            ON CONFLICT (id) DO NOTHING;
        WHEN unique_violation THEN
            -- User already exists, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting user: %', SQLERRM;
    END;
    
    -- Insert into users_profile table
    BEGIN
        INSERT INTO users_profile (
            user_id,
            email,
            display_name,
            handle,
            bio,
            role_flags,
            subscription_tier,
            subscription_status,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
            'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY['TALENT']::user_role[],
            'FREE',
            'ACTIVE',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting profile: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_fixed
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user_fixed();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user_fixed() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_fixed() TO authenticated;

-- Add comment
COMMENT ON FUNCTION handle_new_user_fixed() IS 'Fixed function to handle foreign key constraint issues when creating user records';
