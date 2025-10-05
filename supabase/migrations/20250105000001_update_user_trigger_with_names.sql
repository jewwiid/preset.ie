-- Update the user creation trigger to properly store first_name and last_name from user metadata
-- This ensures names from signup are persisted to the database

-- Drop and recreate the trigger function with improved name handling
DROP FUNCTION IF EXISTS handle_new_user_simple() CASCADE;

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

        -- Insert into users_profile table with improved name handling
        INSERT INTO users_profile (
            user_id,
            email,
            first_name,
            last_name,
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
            -- Extract first_name from user metadata
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            -- Extract last_name from user metadata
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            -- Create display_name with fallback logic:
            -- 1. Use full_name if provided (Google OAuth)
            -- 2. Use name if provided (generic OAuth)
            -- 3. Combine first_name + last_name if provided (email signup)
            -- 4. Fallback to email username
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                CASE
                    WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL OR NEW.raw_user_meta_data->>'last_name' IS NOT NULL
                    THEN TRIM(CONCAT(COALESCE(NEW.raw_user_meta_data->>'first_name', ''), ' ', COALESCE(NEW.raw_user_meta_data->>'last_name', '')))
                    ELSE SPLIT_PART(NEW.email, '@', 1)
                END
            ),
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;

CREATE TRIGGER on_auth_user_created_simple
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_simple();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user_simple() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_simple() TO authenticated;

-- Add comment
COMMENT ON FUNCTION handle_new_user_simple() IS 'Creates user and profile records with first_name, last_name, and display_name from user metadata when a new auth user is created';
