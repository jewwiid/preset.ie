-- Diagnostic check to see what's happening with the triggers and functions

-- Create a function to check trigger status
CREATE OR REPLACE FUNCTION check_trigger_status()
RETURNS JSON AS $$
DECLARE
    trigger_info JSON;
    function_info JSON;
    result JSON;
BEGIN
    -- Check triggers on auth.users
    SELECT json_agg(
        json_build_object(
            'trigger_name', trigger_name,
            'event_manipulation', event_manipulation,
            'action_timing', action_timing,
            'action_statement', action_statement
        )
    ) INTO trigger_info
    FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND event_object_schema = 'auth';
    
    -- Check if our function exists
    SELECT json_build_object(
        'function_exists', EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user_fixed'
            AND routine_schema = 'public'
        ),
        'function_type', (
            SELECT routine_type FROM information_schema.routines 
            WHERE routine_name = 'handle_new_user_fixed'
            AND routine_schema = 'public'
            LIMIT 1
        )
    ) INTO function_info;
    
    result := json_build_object(
        'triggers', COALESCE(trigger_info, '[]'::json),
        'function', function_info
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_trigger_status() TO service_role;
GRANT EXECUTE ON FUNCTION check_trigger_status() TO authenticated;

-- Also create a simple test to see if we can insert into users table at all
CREATE OR REPLACE FUNCTION test_users_insert()
RETURNS JSON AS $$
DECLARE
    test_id UUID;
    result JSON;
BEGIN
    test_id := gen_random_uuid();
    
    BEGIN
        -- Try to insert into users table
        INSERT INTO public.users (id, email, role, created_at, updated_at)
        VALUES (
            test_id,
            'test@example.com',
            'TALENT',
            NOW(),
            NOW()
        );
        
        result := json_build_object(
            'success', true,
            'message', 'Users table insert successful',
            'test_id', test_id
        );
        
        -- Clean up
        DELETE FROM public.users WHERE id = test_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            result := json_build_object(
                'success', false,
                'error', SQLERRM,
                'error_code', SQLSTATE
            );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_users_insert() TO service_role;
GRANT EXECUTE ON FUNCTION test_users_insert() TO authenticated;
