-- Fix the create_default_notification_preferences function to handle foreign key constraint
-- The issue is that it's trying to insert before the user exists in public.users

-- Drop the existing function
DROP FUNCTION IF EXISTS public.create_default_notification_preferences() CASCADE;

-- Recreate the function with proper error handling
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if the user exists in public.users
  IF EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.notification_preferences (
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
      vibration_enabled,
      marketplace_notifications,
      listing_notifications,
      offer_notifications,
      order_notifications,
      payment_notifications,
      review_notifications,
      dispute_notifications
    )
    VALUES (
      NEW.id,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      'real-time',
      'UTC',
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER create_default_notification_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Verify the function was created
SELECT 'create_default_notification_preferences function fixed with proper user check!' as status;
