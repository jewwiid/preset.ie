-- Migration: Check if Marcus Chen (@marcus_model) exists and provide instructions for testing

DO $$
DECLARE
    marcus_exists BOOLEAN := false;
    marcus_auth_id UUID;
    marcus_profile_id UUID;
    auth_user_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Count existing users for context
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM users_profile;
    
    RAISE NOTICE '=== MARCUS CHEN TEST USER STATUS ===';
    RAISE NOTICE 'Total auth users: %', auth_user_count;
    RAISE NOTICE 'Total user profiles: %', profile_count;
    
    -- Check if Marcus exists in profiles
    SELECT EXISTS(
        SELECT 1 FROM users_profile 
        WHERE handle = 'marcus_model' OR display_name ILIKE '%marcus%'
    ) INTO marcus_exists;

    IF marcus_exists THEN
        RAISE NOTICE ' Marcus Chen already exists in the database';
        
        -- Show existing Marcus info
        SELECT up.user_id, up.id INTO marcus_auth_id, marcus_profile_id
        FROM users_profile up 
        WHERE up.handle = 'marcus_model' OR up.display_name ILIKE '%marcus%'
        LIMIT 1;
        
        RAISE NOTICE 'Marcus Auth ID: %, Profile ID: %', marcus_auth_id, marcus_profile_id;
        
        -- Update Marcus to ensure he has proper test data
        UPDATE users_profile 
        SET 
            display_name = 'Marcus Chen',
            handle = 'marcus_model',
            bio = 'Professional photographer specializing in portraits and fashion photography. Available for creative collaborations.',
            city = 'Los Angeles',
            style_tags = ARRAY['Portrait', 'Fashion', 'Street', 'Editorial'],
            date_of_birth = '1995-06-15'::date,
            subscription_tier = 'FREE',
            updated_at = NOW()
        WHERE user_id = marcus_auth_id;
        
        RAISE NOTICE ' Updated Marcus Chen profile with complete test data';
        
        -- Show Marcus login email
        PERFORM 
        FROM auth.users au
        WHERE au.id = marcus_auth_id;
        
    ELSE
        RAISE NOTICE 'L Marcus Chen does not exist in the database';
        RAISE NOTICE '';
        RAISE NOTICE '=== RECOMMENDED STEPS TO CREATE MARCUS FOR TESTING ===';
        RAISE NOTICE '1. Go to http://localhost:3000/signup in your browser';
        RAISE NOTICE '2. Sign up with these credentials:';
        RAISE NOTICE '   Email: marcus@test.com';
        RAISE NOTICE '   Password: TestPassword123!';
        RAISE NOTICE '3. During profile setup:';
        RAISE NOTICE '   Display Name: Marcus Chen';
        RAISE NOTICE '   Handle: marcus_model';
        RAISE NOTICE '   City: Los Angeles';
        RAISE NOTICE '   Bio: Professional photographer specializing in portraits and fashion photography';
        RAISE NOTICE '4. After signup, Marcus will be available for verification testing';
        RAISE NOTICE '';
        RAISE NOTICE '=== TO TEST VERIFICATION SYSTEM ===';
        RAISE NOTICE '1. Login as Marcus: marcus@test.com / TestPassword123!';
        RAISE NOTICE '2. Go to http://localhost:3000/verify';
        RAISE NOTICE '3. Upload an age verification document (any ID image)';
        RAISE NOTICE '4. Submit the verification request';
        RAISE NOTICE '5. Access admin panel to review: http://localhost:3000/admin';
        RAISE NOTICE '6. Test approval/rejection with automatic document deletion';
    END IF;

    -- Show current verification requests for context
    RAISE NOTICE '=== CURRENT VERIFICATION REQUESTS (Last 5) ===';
    
END $$;

-- Show recent verification requests
SELECT 
    'Recent Verification Requests:' as info,
    vr.id,
    vr.request_type,
    vr.status,
    vr.submitted_at,
    COALESCE(up.display_name, 'Unknown User') as user_name,
    COALESCE(up.handle, 'unknown') as user_handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.id
ORDER BY vr.submitted_at DESC
LIMIT 5;