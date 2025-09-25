-- Fix OAuth triggers by combining them into a single, comprehensive trigger
-- This prevents conflicts between multiple triggers on the same event

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;

-- Create a comprehensive function that handles both user and profile creation
CREATE OR REPLACE FUNCTION handle_new_user_comprehensive()
RETURNS TRIGGER AS $$
DECLARE
    profile_handle VARCHAR(50);
    handle_counter INTEGER := 1;
    user_role_value user_role;
BEGIN
    -- Determine user role from metadata or default to TALENT
    user_role_value := COALESCE(
        (NEW.raw_user_meta_data->>'role')::user_role,
        'TALENT'
    );
    
    -- Insert into users table
    BEGIN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            user_role_value,
            NOW(),
            NOW()
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- User already exists, just continue
            NULL;
        WHEN OTHERS THEN
            -- Log the error and re-raise
            RAISE LOG 'Error inserting user in handle_new_user_comprehensive: %', SQLERRM;
            RAISE;
    END;
    
    -- Generate a unique handle based on email
    profile_handle := LOWER(REGEXP_REPLACE(NEW.email, '[^a-zA-Z0-9]', '', 'g'));
    
    -- Ensure handle is not empty and starts with a letter
    IF profile_handle = '' OR profile_handle !~ '^[a-z]' THEN
        profile_handle := 'user' || EXTRACT(EPOCH FROM NOW())::BIGINT;
    END IF;
    
    -- Limit handle length to 50 characters
    IF LENGTH(profile_handle) > 50 THEN
        profile_handle := LEFT(profile_handle, 50);
    END IF;
    
    -- Check if handle already exists and make it unique
    WHILE EXISTS (SELECT 1 FROM users_profile WHERE handle = profile_handle) LOOP
        profile_handle := LEFT(profile_handle, 45) || '_' || handle_counter;
        handle_counter := handle_counter + 1;
    END LOOP;
    
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
            profile_handle,
            'Welcome to Preset! Complete your profile to get started.',
            ARRAY[user_role_value]::user_role[],
            'FREE',
            'ACTIVE',
            NOW(),
            NOW()
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Profile already exists, just continue
            NULL;
        WHEN OTHERS THEN
            -- Log the error and re-raise
            RAISE LOG 'Error inserting profile in handle_new_user_comprehensive: %', SQLERRM;
            RAISE;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the single trigger
CREATE TRIGGER on_auth_user_created_comprehensive
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user_comprehensive();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user_comprehensive() TO service_role;

-- Add comment explaining the fix
COMMENT ON FUNCTION handle_new_user_comprehensive() IS 'Comprehensive function that creates both user and profile records when a new auth user is created via OAuth or email signup';
