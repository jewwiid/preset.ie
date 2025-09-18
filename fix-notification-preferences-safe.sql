-- Fix notification_preferences table safely
-- This adds missing columns to existing table without recreating it

-- First, let's see what columns exist
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Check if email_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'email_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN email_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added email_notifications column';
    ELSE
        RAISE NOTICE 'email_notifications column already exists';
    END IF;
    
    -- Check if push_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'push_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN push_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added push_notifications column';
    ELSE
        RAISE NOTICE 'push_notifications column already exists';
    END IF;
    
    -- Check if message_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'message_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN message_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added message_notifications column';
    ELSE
        RAISE NOTICE 'message_notifications column already exists';
    END IF;
    
    -- Check if gig_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'gig_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN gig_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added gig_notifications column';
    ELSE
        RAISE NOTICE 'gig_notifications column already exists';
    END IF;
    
    -- Check if application_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'application_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN application_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added application_notifications column';
    ELSE
        RAISE NOTICE 'application_notifications column already exists';
    END IF;
    
    -- Check if review_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'review_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN review_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added review_notifications column';
    ELSE
        RAISE NOTICE 'review_notifications column already exists';
    END IF;
    
    -- Check if marketing_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'marketing_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN marketing_notifications BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added marketing_notifications column';
    ELSE
        RAISE NOTICE 'marketing_notifications column already exists';
    END IF;
    
    -- Check if weekly_digest column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'weekly_digest'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN weekly_digest BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added weekly_digest column';
    ELSE
        RAISE NOTICE 'weekly_digest column already exists';
    END IF;
    
    -- Check if marketplace_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'marketplace_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN marketplace_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added marketplace_notifications column';
    ELSE
        RAISE NOTICE 'marketplace_notifications column already exists';
    END IF;
    
    -- Check if listing_notifications column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'listing_notifications'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN listing_notifications BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added listing_notifications column';
    ELSE
        RAISE NOTICE 'listing_notifications column already exists';
    END IF;
    
    -- Check if digest_frequency column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'digest_frequency'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN digest_frequency VARCHAR(20) DEFAULT 'daily';
        RAISE NOTICE 'Added digest_frequency column';
    ELSE
        RAISE NOTICE 'digest_frequency column already exists';
    END IF;
    
    -- Check if quiet_hours_start column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'quiet_hours_start'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN quiet_hours_start TIME;
        RAISE NOTICE 'Added quiet_hours_start column';
    ELSE
        RAISE NOTICE 'quiet_hours_start column already exists';
    END IF;
    
    -- Check if quiet_hours_end column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_preferences' 
        AND column_name = 'quiet_hours_end'
        AND table_schema = 'public'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        ALTER TABLE notification_preferences 
        ADD COLUMN quiet_hours_end TIME;
        RAISE NOTICE 'Added quiet_hours_end column';
    ELSE
        RAISE NOTICE 'quiet_hours_end column already exists';
    END IF;
    
    RAISE NOTICE 'Notification preferences table structure updated successfully!';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_email ON notification_preferences(email_notifications);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_push ON notification_preferences(push_notifications);

-- Enable Row Level Security if not already enabled
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notification_preferences' 
        AND policyname = 'Users can access own preferences'
    ) THEN
        CREATE POLICY "Users can access own preferences" ON notification_preferences
            FOR ALL USING (auth.uid() = user_id);
        RAISE NOTICE 'Created RLS policy for notification_preferences';
    ELSE
        RAISE NOTICE 'RLS policy already exists for notification_preferences';
    END IF;
END $$;

-- Create or replace the function to create default notification preferences
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (
    user_id,
    email_notifications,
    push_notifications,
    message_notifications,
    gig_notifications,
    application_notifications,
    review_notifications,
    marketing_notifications,
    weekly_digest,
    marketplace_notifications,
    listing_notifications
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    true,
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic notification preferences creation
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON auth.users;
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Grant permissions
GRANT ALL ON notification_preferences TO authenticated;

SELECT 'Notification preferences table fixed successfully!' as status;
