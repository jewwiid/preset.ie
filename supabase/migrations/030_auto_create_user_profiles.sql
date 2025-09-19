-- Create function to automatically create user profile when a new user signs up
CREATE OR REPLACE FUNCTION create_user_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_handle VARCHAR(50);
    handle_counter INTEGER := 1;
BEGIN
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
    
    -- Create user profile
    INSERT INTO users_profile (
        user_id,
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
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        profile_handle,
        'Welcome to Preset! Complete your profile to get started.',
        ARRAY['TALENT']::user_role[],
        'FREE',
        'ACTIVE',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when a new user is created
DROP TRIGGER IF EXISTS trigger_create_user_profile ON auth.users;
CREATE TRIGGER trigger_create_user_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile_on_signup();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_profile_on_signup() TO service_role;

-- Create profile for existing user if they don't have one
INSERT INTO users_profile (
    user_id,
    display_name,
    handle,
    bio,
    role_flags,
    subscription_tier,
    subscription_status,
    created_at,
    updated_at
)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email),
    'user_' || EXTRACT(EPOCH FROM u.created_at)::BIGINT,
    'Welcome to Preset! Complete your profile to get started.',
    ARRAY['TALENT']::user_role[],
    'FREE',
    'ACTIVE',
    NOW(),
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM users_profile p WHERE p.user_id = u.id
);
