-- Add notification preferences creation to user signup trigger
-- This ensures every new user gets default notification preferences automatically

-- First, check current trigger function
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%handle_new_user%'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name DESC
LIMIT 1;

-- Add notification preferences creation to the trigger
-- Find which trigger is currently active and update it

-- This is a template - we need to modify the active handle_new_user function
-- to include notification_preferences creation

CREATE OR REPLACE FUNCTION public.create_notification_preferences_for_user(user_auth_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
        user_auth_id,
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
    )
    ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicates

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error creating notification preferences: %', SQLERRM;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_notification_preferences_for_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_notification_preferences_for_user(UUID) TO authenticated;

-- Now call this function in the handle_new_user trigger
-- First check which function is active
DO $$
DECLARE
    trigger_function TEXT;
BEGIN
    SELECT tgfoid::regproc::text INTO trigger_function
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    LIMIT 1;

    RAISE NOTICE 'Current trigger function: %', trigger_function;
END $$;
