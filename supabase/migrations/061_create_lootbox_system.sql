-- Create lootbox events table to track when lootbox is available
CREATE TABLE IF NOT EXISTS public.lootbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- 'available', 'purchased', 'expired'
    nano_banana_threshold INTEGER NOT NULL DEFAULT 10000,
    nano_banana_credits_at_trigger INTEGER NOT NULL,
    user_credits_offered INTEGER NOT NULL DEFAULT 2000,
    price_usd DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2) NOT NULL,
    available_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    purchased_at TIMESTAMP WITH TIME ZONE,
    purchased_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lootbox packages table for dynamic packages
CREATE TABLE IF NOT EXISTS public.lootbox_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_credits INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    nano_banana_threshold INTEGER NOT NULL DEFAULT 10000,
    margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 35.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default lootbox package
INSERT INTO public.lootbox_packages (
    name, 
    description, 
    user_credits, 
    price_usd, 
    nano_banana_threshold,
    margin_percentage
) VALUES (
    'Lootbox Special',
    'Limited time offer! Get 2000 credits at a special price when we have excess capacity.',
    2000,
    0.00, -- Will be calculated dynamically
    10000,
    35.0
) ON CONFLICT DO NOTHING;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_lootbox_events_available 
ON public.lootbox_events(event_type, available_at) 
WHERE event_type = 'available' AND expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_lootbox_packages_active 
ON public.lootbox_packages(is_active, nano_banana_threshold);

-- Add RLS policies
ALTER TABLE public.lootbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lootbox_packages ENABLE ROW LEVEL SECURITY;

-- Allow users to read lootbox packages
CREATE POLICY "Users can read lootbox packages" ON public.lootbox_packages
    FOR SELECT USING (true);

-- Allow users to read their own lootbox events
CREATE POLICY "Users can read their own lootbox events" ON public.lootbox_events
    FOR SELECT USING (auth.uid() = purchased_by);

-- Allow service role to manage lootbox events
CREATE POLICY "Service role can manage lootbox events" ON public.lootbox_events
    FOR ALL USING (true);

-- Allow service role to manage lootbox packages
CREATE POLICY "Service role can manage lootbox packages" ON public.lootbox_packages
    FOR ALL USING (true);
