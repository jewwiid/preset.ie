-- Create missing notification preferences for existing users
-- and set up automatic creation for new users

-- Step 1: Create notification preferences for ALL existing users who don't have them
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
)
SELECT
    au.id,
    true,  -- email_enabled
    true,  -- push_enabled
    true,  -- in_app_enabled
    true,  -- gig_notifications
    true,  -- application_notifications
    true,  -- message_notifications
    true,  -- booking_notifications
    true,  -- system_notifications
    false, -- marketing_notifications
    'real-time', -- digest_frequency
    'UTC', -- timezone
    true,  -- badge_count_enabled
    true,  -- sound_enabled
    true   -- vibration_enabled
FROM auth.users au
LEFT JOIN notification_preferences np ON au.id = np.user_id
WHERE np.user_id IS NULL; -- Only create for users who don't have preferences

-- Step 2: Create a trigger function to auto-create notification preferences
CREATE OR REPLACE FUNCTION public.create_notification_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
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

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating notification preferences for user %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Don't fail user creation if preferences fail
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger on auth.users
DROP TRIGGER IF EXISTS create_notification_preferences_on_signup ON auth.users;
CREATE TRIGGER create_notification_preferences_on_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_preferences_for_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notification_preferences_for_new_user() TO service_role;

-- Verify the fix
SELECT
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM notification_preferences) as users_with_preferences,
    (SELECT COUNT(*) FROM auth.users au LEFT JOIN notification_preferences np ON au.id = np.user_id WHERE np.user_id IS NULL) as users_missing_preferences;
