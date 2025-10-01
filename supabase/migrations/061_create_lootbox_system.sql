-- Create lootbox packages table for dynamic packages first (referenced by lootbox_events)
-- V2: Removed nano_banana_threshold (legacy field, not used in time-based model)
CREATE TABLE IF NOT EXISTS public.lootbox_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_credits INTEGER NOT NULL,
    price_usd DECIMAL(10,2) NOT NULL,
    nano_banana_threshold INTEGER DEFAULT 0, -- Legacy field, kept for backward compatibility
    margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 35.0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default lootbox packages (time-based, no threshold needed)
INSERT INTO public.lootbox_packages (
    name, 
    description, 
    user_credits, 
    price_usd, 
    nano_banana_threshold,
    margin_percentage,
    is_active
) VALUES 
(
    '🎉 Weekend Warrior',
    'WEEKEND SPECIAL! Get 2000 credits at 35% off regular price. Available Friday 6pm - Sunday 11pm.',
    2000,
    455.00, -- Regular: $700 (2000 * $0.35), Lootbox: $455 (35% off)
    0, -- Legacy field, not used
    35.0,
    true
),
(
    '💎 Weekend Mega Pack',
    'WEEKEND EXCLUSIVE! 5000 credits at an incredible discount. Limited time only!',
    5000,
    1137.50, -- Regular: $1,750 (5000 * $0.35), Lootbox: $1,137.50 (35% off)
    0, -- Legacy field, not used
    35.0,
    true
)
ON CONFLICT DO NOTHING;

-- Create lootbox events table to track purchases
-- V2: Time-based triggers instead of credit-based
-- IMPORTANT: Users can only purchase ONE lootbox per event period
CREATE TABLE IF NOT EXISTS public.lootbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL DEFAULT 'purchased', -- 'purchased'
    event_name VARCHAR(100), -- e.g., 'Weekend Flash Sale', 'Mid-Month Deal'
    event_period VARCHAR(50), -- e.g., '2025-W40', '2025-10-15' for tracking unique periods
    package_id UUID REFERENCES public.lootbox_packages(id),
    user_credits_offered INTEGER NOT NULL DEFAULT 2000,
    price_usd DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2) NOT NULL DEFAULT 35.0,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    purchased_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one purchase per user per event period
    UNIQUE(purchased_by, event_period)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_lootbox_events_purchased 
ON public.lootbox_events(purchased_by, purchased_at);

CREATE INDEX IF NOT EXISTS idx_lootbox_packages_active 
ON public.lootbox_packages(is_active, user_credits);

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
