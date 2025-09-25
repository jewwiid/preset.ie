-- Simple OAuth fix - create a basic trigger that should work
-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_user_profile_on_signup();
DROP FUNCTION IF EXISTS handle_new_user_comprehensive();

-- Create a simple, robust function for user creation
CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO public.users (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        'TALENT',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Generate a simple handle
    DECLARE
        profile_handle TEXT;
    BEGIN
        profile_handle := 'user_' || EXTRACT(EPOCH FROM NOW())::BIGINT;
        
        -- Insert into users_profile table
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
            profile_handle,
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY['TALENT']::user_role[],
            'FREE',
            'ACTIVE',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE LOG 'Error in handle_new_user_simple: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_simple
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user_simple();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user_simple() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_simple() TO authenticated;

-- Add comment
COMMENT ON FUNCTION handle_new_user_simple() IS 'Simple function to create user and profile records when a new auth user is created';
