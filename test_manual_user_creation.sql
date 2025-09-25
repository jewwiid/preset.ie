-- Test manual user creation to identify the issue
-- This will help us understand what's blocking OAuth user creation

-- 1. Check if we can insert into auth.users (this will likely fail due to permissions)
DO $$
BEGIN
    RAISE NOTICE 'Testing manual user creation...';
    
    -- Try to insert a test user (this will likely fail)
    BEGIN
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud
        ) VALUES (
            gen_random_uuid(),
            'test@example.com',
            crypt('password123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated',
            'authenticated'
        );
        
        RAISE NOTICE 'SUCCESS: Manual user creation worked!';
        
        -- Clean up
        DELETE FROM auth.users WHERE email = 'test@example.com';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Manual user creation failed: %', SQLERRM;
    END;
END $$;

-- 2. Check current user count in auth.users
SELECT 'Current user count in auth.users:' as status, COUNT(*) as user_count FROM auth.users;

-- 3. Check if there are any recent failed attempts
SELECT 'Recent auth events:' as status;
SELECT * FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check auth flow state
SELECT 'Current flow states:' as status;
SELECT * FROM auth.flow_state 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 5;
