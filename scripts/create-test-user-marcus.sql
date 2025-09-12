-- Create test user Marcus Chen (@marcus_model) if he doesn't exist
-- Run this with: npx supabase db execute --file scripts/create-test-user-marcus.sql

-- First, check if Marcus already exists
DO $$
DECLARE
    marcus_exists BOOLEAN := false;
    marcus_auth_id UUID;
    marcus_profile_id UUID;
BEGIN
    -- Check if Marcus exists in profiles
    SELECT EXISTS(
        SELECT 1 FROM users_profile 
        WHERE handle = 'marcus_model' OR display_name ILIKE '%marcus%'
    ) INTO marcus_exists;

    IF marcus_exists THEN
        RAISE NOTICE 'Marcus Chen already exists in the database';
        
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
        
        RAISE NOTICE 'Updated Marcus Chen profile with test data';
    ELSE
        RAISE NOTICE 'Marcus Chen does not exist. Please create him through the normal signup process.';
        RAISE NOTICE 'Recommended steps:';
        RAISE NOTICE '1. Go to http://localhost:3000/signup';
        RAISE NOTICE '2. Sign up with email: marcus@test.com';
        RAISE NOTICE '3. Use password: TestPassword123!';
        RAISE NOTICE '4. Set display name to: Marcus Chen';
        RAISE NOTICE '5. Set handle to: marcus_model';
        RAISE NOTICE '6. Complete profile setup';
    END IF;
END $$;

-- Show current verification requests for testing
SELECT 
    'Current Verification Requests:' as info;

SELECT 
    vr.id,
    vr.request_type,
    vr.status,
    vr.submitted_at,
    COALESCE(up.display_name, 'Unknown User') as user_name,
    COALESCE(up.handle, 'unknown') as user_handle
FROM verification_requests vr
LEFT JOIN users_profile up ON vr.user_id = up.id
ORDER BY vr.submitted_at DESC
LIMIT 10;