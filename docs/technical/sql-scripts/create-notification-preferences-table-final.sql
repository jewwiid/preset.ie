-- Create the notification_preferences table that triggers are trying to access
-- This is the final fix for the missing table issue

-- Drop if exists and recreate
DROP TABLE IF EXISTS public.notification_preferences CASCADE;

CREATE TABLE public.notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    gig_notifications BOOLEAN DEFAULT true,
    application_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    booking_notifications BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    marketing_notifications BOOLEAN DEFAULT false,
    digest_frequency TEXT DEFAULT 'real-time' CHECK (digest_frequency IN ('real-time', 'daily', 'weekly', 'never')),
    timezone TEXT DEFAULT 'UTC',
    badge_count_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,
    marketplace_notifications BOOLEAN DEFAULT true,
    listing_notifications BOOLEAN DEFAULT true,
    offer_notifications BOOLEAN DEFAULT true,
    order_notifications BOOLEAN DEFAULT true,
    payment_notifications BOOLEAN DEFAULT true,
    review_notifications BOOLEAN DEFAULT true,
    dispute_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON public.notification_preferences
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON public.notification_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verify the table was created
SELECT 'notification_preferences table created successfully!' as status;
