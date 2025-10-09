-- ================================================================
-- FIX: User Settings Function Return Type Mismatch
-- 
-- Problem: create_default_user_settings_safe() was defined to return
-- a TABLE with specific columns, but the actual user_settings table
-- has more columns than the function signature declares.
--
-- When the function does RETURNING *, it returns all 14 actual columns,
-- but the function signature says it returns only 11 columns.
--
-- Solution: Change the function to return void since it's only called
-- from a trigger via PERFORM (which discards the result anyway).
-- ================================================================

-- Drop and recreate the function with void return type
DROP FUNCTION IF EXISTS public.create_default_user_settings_safe(UUID);

CREATE OR REPLACE FUNCTION public.create_default_user_settings_safe(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simply insert default settings without returning anything
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
        user_uuid,
        true,
        true,
        false,
        'public',
        true,
        false
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION public.create_default_user_settings_safe(UUID) IS 
'Creates default user settings for a new profile. Returns void since result is not used.';

