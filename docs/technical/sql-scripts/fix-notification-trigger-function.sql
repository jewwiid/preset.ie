-- Fix notification preferences trigger function to match actual table structure
-- The table exists but the trigger function is using wrong column names

-- Create or replace the function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
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
    quiet_hours_start,
    quiet_hours_end,
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
  ) VALUES (
    NEW.id,
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
    NULL,  -- quiet_hours_start
    NULL,  -- quiet_hours_end
    'UTC', -- timezone
    true,  -- badge_count_enabled
    true,  -- sound_enabled
    true,  -- vibration_enabled
    true,  -- marketplace_notifications
    true,  -- listing_notifications
    true,  -- offer_notifications
    true,  -- order_notifications
    true,  -- payment_notifications
    true,  -- review_notifications
    true   -- dispute_notifications
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was updated
SELECT 'Notification preferences trigger function updated successfully!' as status;
