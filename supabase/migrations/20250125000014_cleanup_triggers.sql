-- Clean up conflicting triggers and keep only one working trigger
-- The issue is that multiple triggers are running and conflicting with each other

-- Drop ALL existing triggers on auth.users
DROP TRIGGER IF EXISTS trigger_initialize_user_credits ON auth.users;
DROP TRIGGER IF EXISTS create_default_notification_preferences_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_default_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS initialize_user_credits_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_comprehensive ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_fixed ON auth.users;

-- Drop the old functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_new_user_comprehensive();
DROP FUNCTION IF EXISTS handle_new_user_fixed();
DROP FUNCTION IF EXISTS initialize_user_credits();
DROP FUNCTION IF EXISTS create_default_notification_preferences();
DROP FUNCTION IF EXISTS create_default_user_settings();

-- Create a single, comprehensive function that handles everything
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
BEGIN
    -- Wait a moment to ensure the auth.users record is fully committed
    PERFORM pg_sleep(0.1);
    
    -- Insert into users table
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
        );
    EXCEPTION
        WHEN unique_violation THEN
            -- Profile already exists, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting profile: %', SQLERRM;
    END;
    
    -- Initialize user credits (if the table exists)
    BEGIN
        INSERT INTO user_credits (user_id, credit_balance, created_at, updated_at)
        VALUES (NEW.id, 0, NOW(), NOW());
    EXCEPTION
        WHEN undefined_table THEN
            -- Credits table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Credits already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting credits: %', SQLERRM;
    END;
    
    -- Create default notification preferences (if the table exists)
    BEGIN
        INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, created_at, updated_at)
        VALUES (NEW.id, true, true, NOW(), NOW());
    EXCEPTION
        WHEN undefined_table THEN
            -- Notification preferences table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Preferences already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting notification preferences: %', SQLERRM;
    END;
    
    -- Create default user settings (if the table exists)
    BEGIN
        INSERT INTO user_settings (user_id, created_at, updated_at)
        VALUES (NEW.id, NOW(), NOW());
    EXCEPTION
        WHEN undefined_table THEN
            -- User settings table doesn't exist, skip
            NULL;
        WHEN unique_violation THEN
            -- Settings already exist, that's fine
            NULL;
        WHEN OTHERS THEN
            -- Log the error but don't fail the auth process
            RAISE LOG 'Error inserting user settings: %', SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the single trigger
CREATE TRIGGER on_auth_user_created_complete
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION handle_new_user_complete();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user_complete() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_complete() TO authenticated;

-- Add comment
COMMENT ON FUNCTION handle_new_user_complete() IS 'Complete function to handle all user creation tasks in a single trigger';
