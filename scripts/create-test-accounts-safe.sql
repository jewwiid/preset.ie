-- Safe test account creation script
-- This script creates profiles only for users that actually exist in auth.users

-- First, let's see what users exist in auth.users
SELECT 'Existing users in auth.users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Create profiles only for existing users
-- We'll use a more flexible approach that works with any existing users

-- Get the first user and create an admin profile
DO $$
DECLARE
    first_user_id UUID;
    first_user_email TEXT;
BEGIN
    -- Get the first user from auth.users
    SELECT id, email INTO first_user_id, first_user_email
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Create admin profile for the first user
        INSERT INTO public.users_profile (
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
            first_user_id,
            'Admin User',
            'admin',
            'System administrator for Preset platform',
            ARRAY['ADMIN']::user_role[],
            'PRO',
            'ACTIVE',
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.users_profile 
            WHERE user_id = first_user_id
        );
        
        RAISE NOTICE 'Created admin profile for user: % (%)', first_user_email, first_user_id;
    ELSE
        RAISE NOTICE 'No users found in auth.users table';
    END IF;
END $$;

-- Create profiles for any other existing users
DO $$
DECLARE
    user_record RECORD;
    profile_count INTEGER := 0;
BEGIN
    -- Loop through all users in auth.users
    FOR user_record IN 
        SELECT id, email, created_at 
        FROM auth.users 
        ORDER BY created_at ASC
    LOOP
        -- Skip if profile already exists
        IF NOT EXISTS (SELECT 1 FROM public.users_profile WHERE user_id = user_record.id) THEN
            -- Create profile based on email pattern or default to TALENT
            INSERT INTO public.users_profile (
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
                user_record.id,
                COALESCE(SPLIT_PART(user_record.email, '@', 1), 'User'),
                LOWER(REGEXP_REPLACE(SPLIT_PART(user_record.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
                'Welcome to Preset! Complete your profile to get started.',
                ARRAY['TALENT']::user_role[],
                'FREE',
                'ACTIVE',
                NOW(),
                NOW()
            );
            
            profile_count := profile_count + 1;
            RAISE NOTICE 'Created profile for user: % (%)', user_record.email, user_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total profiles created: %', profile_count;
END $$;

-- Create user credits for all existing profiles (if table exists)
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN 
        SELECT user_id, subscription_tier 
        FROM public.users_profile
    LOOP
        INSERT INTO public.user_credits (
            user_id,
            subscription_tier,
            monthly_allowance,
            current_balance,
            consumed_this_month,
            last_reset_at,
            lifetime_consumed,
            created_at,
            updated_at
        ) 
        SELECT 
            profile_record.user_id,
            profile_record.subscription_tier,
            CASE 
                WHEN profile_record.subscription_tier = 'PRO' THEN 1000
                ELSE 10
            END,
            CASE 
                WHEN profile_record.subscription_tier = 'PRO' THEN 1000
                ELSE 10
            END,
            0,
            NOW(),
            0,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_credits 
            WHERE user_id = profile_record.user_id
        );
    END LOOP;
END $$;

-- Create user settings for all existing profiles (if table exists)
DO $$
DECLARE
    profile_record RECORD;
BEGIN
    FOR profile_record IN 
        SELECT user_id 
        FROM public.users_profile
    LOOP
        INSERT INTO public.user_settings (
            user_id,
            email_notifications,
            push_notifications,
            marketing_emails,
            profile_visibility,
            show_contact_info,
            two_factor_enabled,
            created_at,
            updated_at
        ) 
        SELECT 
            profile_record.user_id,
            TRUE,
            TRUE,
            FALSE,
            'public',
            TRUE,
            FALSE,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM public.user_settings 
            WHERE user_id = profile_record.user_id
        );
    END LOOP;
END $$;

-- Show all created profiles
SELECT 'Created profiles:' as info;
SELECT 
    up.user_id,
    up.display_name,
    up.handle,
    up.role_flags,
    up.subscription_tier,
    au.email,
    up.created_at
FROM public.users_profile up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at;

-- Show user counts by role
SELECT 'User counts by role:' as info;
SELECT 
    role_flags,
    COUNT(*) as user_count
FROM public.users_profile
GROUP BY role_flags
ORDER BY role_flags;

-- Success message
SELECT 'Test accounts created successfully for existing users!' as status;
