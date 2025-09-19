-- Fix user_credits table schema to match application expectations
-- This migration standardizes the credit system columns

-- First, add the missing columns if they don't exist
ALTER TABLE user_credits 
ADD COLUMN IF NOT EXISTS current_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_allowance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consumed_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Migrate existing data from old columns to new ones
UPDATE user_credits 
SET current_balance = COALESCE(balance, 0)
WHERE current_balance IS NULL;

-- Drop the old balance column if it exists (after data migration)
ALTER TABLE user_credits 
DROP COLUMN IF EXISTS balance CASCADE;

-- Create function to initialize user credits
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credits (
        user_id,
        subscription_tier,
        monthly_allowance,
        current_balance,
        consumed_this_month,
        last_reset_at
    )
    SELECT 
        NEW.user_id,
        COALESCE(NEW.subscription_tier, 'free'),
        CASE 
            WHEN NEW.subscription_tier = 'pro' THEN 25
            WHEN NEW.subscription_tier = 'plus' THEN 10
            ELSE 0
        END,
        CASE 
            WHEN NEW.subscription_tier = 'pro' THEN 25
            WHEN NEW.subscription_tier = 'plus' THEN 10
            ELSE 0
        END,
        0,
        NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM user_credits WHERE user_id = NEW.user_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-initialize credits for new users
DROP TRIGGER IF EXISTS init_user_credits_on_profile_create ON users_profile;
CREATE TRIGGER init_user_credits_on_profile_create
AFTER INSERT ON users_profile
FOR EACH ROW
EXECUTE FUNCTION initialize_user_credits();

-- Function to reset monthly credits
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
    UPDATE user_credits
    SET 
        current_balance = monthly_allowance,
        consumed_this_month = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE 
        last_reset_at < date_trunc('month', NOW())
        AND monthly_allowance > 0;
END;
$$ LANGUAGE plpgsql;

-- Initialize credits for existing users who don't have records
INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at
)
SELECT 
    u.id,
    COALESCE(p.subscription_tier, 'free'),
    CASE 
        WHEN p.subscription_tier = 'pro' THEN 25
        WHEN p.subscription_tier = 'plus' THEN 10
        ELSE 0
    END,
    CASE 
        WHEN p.subscription_tier = 'pro' THEN 25
        WHEN p.subscription_tier = 'plus' THEN 10
        ELSE 0
    END,
    0,
    NOW()
FROM auth.users u
LEFT JOIN users_profile p ON p.user_id = u.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_credits uc WHERE uc.user_id = u.id
);