-- Test migration to check actual table structure
-- This will help us understand what columns actually exist

-- Step 1: Try to insert a simple record and see what happens
DO $$
DECLARE
    test_user_id UUID := '57fe9bb7-b5a0-4f71-bff5-241eecdd4dfd';
    result RECORD;
BEGIN
    -- Try to insert a basic record
    BEGIN
        INSERT INTO user_settings (
            user_id,
            email_notifications,
            push_notifications,
            marketing_emails,
            profile_visibility,
            show_contact_info,
            two_factor_enabled
        )
        VALUES (
            test_user_id,
            true,
            true,
            false,
            'public',
            true,
            false
        )
        RETURNING * INTO result;
        
        RAISE NOTICE 'SUCCESS: Record inserted with ID: %', result.id;
        RAISE NOTICE 'User ID: %, Email Notifications: %', result.user_id, result.email_notifications;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: %', SQLERRM;
        RAISE NOTICE 'SQLSTATE: %', SQLSTATE;
    END;
END $$;

-- Step 2: Check if we can query the table
DO $$
DECLARE
    row_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO row_count FROM user_settings;
    RAISE NOTICE 'Table has % rows', row_count;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error querying table: %', SQLERRM;
END $$;

-- Step 3: Check table structure
DO $$
DECLARE
    col_info RECORD;
BEGIN
    RAISE NOTICE 'Table structure:';
    FOR col_info IN 
        SELECT column_name, data_type, ordinal_position
        FROM information_schema.columns 
        WHERE table_name = 'user_settings' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column %: % (%)', col_info.ordinal_position, col_info.column_name, col_info.data_type;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error getting table structure: %', SQLERRM;
END $$;
