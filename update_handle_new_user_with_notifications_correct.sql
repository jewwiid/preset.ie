-- Update handle_new_user_simple to create notification_preferences
-- Uses ACTUAL column names from the database schema

CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS TRIGGER AS $$
DECLARE
    profile_handle TEXT;
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
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
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

    -- ✨ Create default notification preferences with ACTUAL column names
    INSERT INTO notification_preferences (
        user_id,
        -- Legacy columns (if they exist)
        email_notifications,
        in_app_notifications,
        push_notifications,
        -- New columns
        email_enabled,
        push_enabled,
        in_app_enabled,
        -- Notification categories
        gig_notifications,
        application_notifications,
        message_notifications,
        collaboration_notifications,
        marketplace_notifications,
        system_notifications,
        -- Settings
        notification_frequency,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        quiet_hours_timezone,
        -- Additional preferences
        booking_notifications,
        marketing_notifications,
        digest_frequency,
        timezone,
        badge_count_enabled,
        sound_enabled,
        vibration_enabled
    ) VALUES (
        NEW.id,
        -- Legacy columns
        true,  -- email_notifications
        true,  -- in_app_notifications
        true,  -- push_notifications
        -- New columns
        true,  -- email_enabled
        true,  -- push_enabled
        true,  -- in_app_enabled
        -- Notification categories
        true,  -- gig_notifications
        true,  -- application_notifications
        true,  -- message_notifications
        true,  -- collaboration_notifications
        true,  -- marketplace_notifications
        true,  -- system_notifications
        -- Settings
        'immediate',  -- notification_frequency
        false, -- quiet_hours_enabled
        '22:00:00', -- quiet_hours_start
        '08:00:00', -- quiet_hours_end
        'UTC',  -- quiet_hours_timezone
        -- Additional preferences
        true,  -- booking_notifications
        false, -- marketing_notifications
        'real-time', -- digest_frequency
        'UTC', -- timezone
        true,  -- badge_count_enabled
        true,  -- sound_enabled
        true   -- vibration_enabled
    )
    ON CONFLICT (user_id) DO NOTHING;

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

-- Backfill: Create preferences for existing users who don't have them
INSERT INTO notification_preferences (
    user_id,
    email_notifications, in_app_notifications, push_notifications,
    email_enabled, push_enabled, in_app_enabled,
    gig_notifications, application_notifications, message_notifications,
    collaboration_notifications, marketplace_notifications, system_notifications,
    notification_frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, quiet_hours_timezone,
    booking_notifications, marketing_notifications,
    digest_frequency, timezone, badge_count_enabled, sound_enabled, vibration_enabled
)
SELECT
    au.id,
    true, true, true,  -- legacy
    true, true, true,  -- new enabled flags
    true, true, true, true, true, true,  -- categories
    'immediate', false, '22:00:00', '08:00:00', 'UTC',  -- settings
    true, false,  -- booking, marketing
    'real-time', 'UTC', true, true, true  -- additional
FROM auth.users au
LEFT JOIN notification_preferences np ON au.id = np.user_id
WHERE np.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Verify the fix
SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM notification_preferences) as users_with_prefs,
    CASE
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM notification_preferences)
        THEN '✅ All users have notification preferences'
        ELSE '⚠️ Some users missing preferences'
    END as status;
