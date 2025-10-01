-- Test Lootbox Setup Script V2 - Time-Based Triggers
-- This creates test lootbox packages for testing the Stripe integration
-- NOTE: Lootboxes now use time-based triggers (weekends, mid-month) instead of NanoBanana credits

-- First, check if lootbox tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lootbox_packages', 'lootbox_events');

-- Clear existing test lootbox packages
DELETE FROM public.lootbox_packages WHERE name LIKE '%Test%' OR name LIKE '%Lootbox%';

-- Insert Weekend Flash Sale Packages
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
    0, -- Not used anymore, but keeping for schema compatibility
    35.0,
    true
),
(
    '💎 Weekend Mega Pack',
    'WEEKEND EXCLUSIVE! 5000 credits at an incredible discount. Limited time only!',
    5000,
    1137.50, -- Regular: $1,750 (5000 * $0.35), Lootbox: $1,137.50 (35% off)
    0,
    35.0,
    true
),
(
    '⚡ Weekend Ultra Bundle',
    'ULTRA RARE! 10,000 credits at maximum savings. Don''t miss out!',
    10000,
    2275.00, -- Regular: $3,500 (10000 * $0.35), Lootbox: $2,275 (35% off)
    0,
    35.0,
    true
)
ON CONFLICT DO NOTHING;

-- Verify the lootbox packages were created
SELECT 
    id,
    name,
    description,
    user_credits,
    price_usd,
    (price_usd / user_credits) as price_per_credit,
    (user_credits * 0.35) as regular_price,
    ROUND((1 - (price_usd / (user_credits * 0.35))) * 100, 0) as discount_percent,
    is_active,
    created_at
FROM public.lootbox_packages
WHERE is_active = true
ORDER BY user_credits ASC;

-- Show when lootbox will be available
SELECT 
    CASE 
        WHEN EXTRACT(DOW FROM NOW()) = 5 AND EXTRACT(HOUR FROM NOW()) >= 18 THEN '✅ ACTIVE NOW - Weekend Flash Sale!'
        WHEN EXTRACT(DOW FROM NOW()) IN (6, 0) THEN '✅ ACTIVE NOW - Weekend Flash Sale!'
        WHEN EXTRACT(DAY FROM NOW()) BETWEEN 15 AND 17 THEN '✅ ACTIVE NOW - Mid-Month Mega Deal!'
        ELSE '⏰ Not currently active. Next event: ' || 
            CASE 
                WHEN EXTRACT(DOW FROM NOW()) < 5 THEN 'Friday 6pm'
                WHEN EXTRACT(DAY FROM NOW()) < 15 THEN '15th of this month'
                ELSE 'Next Friday 6pm or 15th of next month'
            END
    END as lootbox_status;

-- Pricing breakdown
SELECT 
    '🎯 Lootbox Pricing Strategy' as info,
    'Regular Pro Tier: $0.35/credit' as regular_pricing,
    'Lootbox Discount: 35% off' as discount,
    'Final Price: $0.23/credit' as lootbox_pricing,
    'Platform Cost (Wavespeed): ~$0.08/credit' as platform_cost,
    'Platform Margin: ~187%' as margin,
    'Customer Saves: $0.12/credit' as customer_savings;

