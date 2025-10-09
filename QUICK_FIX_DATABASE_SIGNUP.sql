-- ================================================================
-- QUICK FIX FOR SIGNUP ERROR
-- Run this in Supabase SQL Editor to fix the profile creation issue
-- ================================================================

-- THE PROBLEM:
-- The create_default_user_settings_safe() function signature says it returns
-- 11 columns, but the actual user_settings table now has 14 columns (after
-- some columns were added). When the function does "RETURNING *", it returns  
-- all 14 columns, causing a mismatch error.

-- THE FIX:
-- Change the function to return void instead of a table, since the trigger
-- that calls it uses PERFORM (which discards the result anyway).

-- Drop the old function
DROP FUNCTION IF EXISTS public.create_default_user_settings_safe(UUID);

-- Recreate with void return type
CREATE OR REPLACE FUNCTION public.create_default_user_settings_safe(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

-- Verify the fix worked
SELECT 
    proname as function_name,
    pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'create_default_user_settings_safe';

-- You should see: return_type = "void"

