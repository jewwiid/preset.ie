-- Update handle_new_user_simple to also create notification_preferences
-- This is the ROOT CAUSE fix - preferences should be created on user signup

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
            -- Create display_name with fallback logic
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

        -- ✨ NEW: Create default notification preferences
        INSERT INTO notification_preferences (
            user_id,
            email_enabled,
            push_enabled,
            in_app_enabled,
            gig_notifications,
            application_notifications,
            message_notifications,
            booking_notifications,
            system_notifications,
            marketing_notifications,
            digest_frequency,
            timezone,
            badge_count_enabled,
            sound_enabled,
            vibration_enabled
        ) VALUES (
            NEW.id,
            true, true, true, true, true, true, true, true, false,
            'real-time', 'UTC', true, true, true
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user_simple() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_simple() TO authenticated;

-- Also create preferences for existing users who don't have them
INSERT INTO notification_preferences (
    user_id, email_enabled, push_enabled, in_app_enabled,
    gig_notifications, application_notifications, message_notifications,
    booking_notifications, system_notifications, marketing_notifications,
    digest_frequency, timezone, badge_count_enabled, sound_enabled, vibration_enabled
)
SELECT
    au.id, true, true, true, true, true, true, true, true, false,
    'real-time', 'UTC', true, true, true
FROM auth.users au
LEFT JOIN notification_preferences np ON au.id = np.user_id
WHERE np.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM notification_preferences) as users_with_prefs;
