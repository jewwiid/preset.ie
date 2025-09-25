-- Test function to manually create a user and profile
-- This will help us debug if the issue is with the trigger or the database operations

CREATE OR REPLACE FUNCTION test_create_user(
    test_user_id UUID DEFAULT gen_random_uuid(),
    test_email TEXT DEFAULT 'test@example.com'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- Try to insert into users table
    BEGIN
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            test_user_id,
            test_email,
            'TALENT',
            NOW(),
            NOW()
        );
        
        result := json_build_object('users_insert', 'success');
    EXCEPTION
        WHEN OTHERS THEN
            result := json_build_object('users_insert', 'failed', 'error', SQLERRM);
            RETURN result;
    END;
    
    -- Try to insert into users_profile table
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
            test_user_id,
            test_email,
            'Test User',
            'test_user_' || EXTRACT(EPOCH FROM NOW())::BIGINT,
            'Test profile',
            ARRAY['TALENT']::user_role[],
            'FREE',
            'ACTIVE',
            NOW(),
            NOW()
        );
        
        result := json_build_object(
            'users_insert', 'success',
            'profile_insert', 'success',
            'user_id', test_user_id
        );
    EXCEPTION
        WHEN OTHERS THEN
            result := json_build_object(
                'users_insert', 'success',
                'profile_insert', 'failed',
                'error', SQLERRM,
                'user_id', test_user_id
            );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION test_create_user(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION test_create_user(UUID, TEXT) TO authenticated;

-- Also create a function to check if our trigger exists
CREATE OR REPLACE FUNCTION check_triggers()
RETURNS JSON AS $$
DECLARE
    trigger_count INTEGER;
    function_exists BOOLEAN;
BEGIN
    -- Check if our trigger exists
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created_simple'
    AND event_object_table = 'users'
    AND event_object_schema = 'auth';
    
    -- Check if our function exists
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user_simple'
        AND routine_schema = 'public'
    ) INTO function_exists;
    
    RETURN json_build_object(
        'trigger_exists', trigger_count > 0,
        'trigger_count', trigger_count,
        'function_exists', function_exists
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_triggers() TO service_role;
GRANT EXECUTE ON FUNCTION check_triggers() TO authenticated;
