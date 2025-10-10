-- Fix Marketing Email Preferences to be OPT-IN (GDPR Compliance)
-- Migration: 20251010100000_fix_marketing_email_opt_in.sql
-- 
-- Changes:
-- 1. Change marketing_notifications default from TRUE to FALSE
-- 2. Update existing users to opt-out by default
-- 3. Add clear documentation

-- Step 1: Change the default for future users
ALTER TABLE public.notification_preferences 
ALTER COLUMN marketing_notifications SET DEFAULT false;

-- Step 2: Update existing users to opt-out
-- (They can opt-in later if they want marketing emails)
UPDATE public.notification_preferences 
SET marketing_notifications = false,
    updated_at = NOW()
WHERE marketing_notifications = true;

-- Step 3: Add helpful comment
COMMENT ON COLUMN public.notification_preferences.marketing_notifications IS 
'Marketing emails require explicit OPT-IN. Users must actively choose to receive marketing/promotional emails. Default is FALSE for GDPR compliance.';

-- Step 4: Create an index for faster filtering
CREATE INDEX IF NOT EXISTS idx_notification_preferences_marketing 
ON public.notification_preferences(user_id, marketing_notifications) 
WHERE marketing_notifications = true;

COMMENT ON INDEX idx_notification_preferences_marketing IS 
'Optimized index for finding users who opted into marketing emails';

-- Step 5: Add helpful view for marketing-enabled users
CREATE OR REPLACE VIEW public.marketing_enabled_users AS
SELECT 
  np.user_id,
  up.display_name,
  up.role_flags,
  up.city,
  up.subscription_tier,
  np.email_enabled,
  np.marketing_notifications,
  np.created_at as preference_created_at,
  np.updated_at as preference_updated_at
FROM public.notification_preferences np
JOIN public.users_profile up ON up.user_id = np.user_id
WHERE np.email_enabled = true 
  AND np.marketing_notifications = true;

COMMENT ON VIEW public.marketing_enabled_users IS 
'Users who have opted into marketing emails. Use this for campaign targeting.';

-- Verification query
DO $$
DECLARE
  total_users INTEGER;
  opted_in_users INTEGER;
  opt_in_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_users FROM public.notification_preferences;
  SELECT COUNT(*) INTO opted_in_users FROM public.notification_preferences WHERE marketing_notifications = true;
  
  IF total_users > 0 THEN
    opt_in_percentage := (opted_in_users::NUMERIC / total_users::NUMERIC * 100);
    RAISE NOTICE 'Marketing Email Stats:';
    RAISE NOTICE '  Total users: %', total_users;
    RAISE NOTICE '  Opted into marketing: %', opted_in_users;
    RAISE NOTICE '  Opt-in rate: % percent', ROUND(opt_in_percentage, 2);
  ELSE
    RAISE NOTICE 'No users found in notification_preferences table';
  END IF;
END $$;

