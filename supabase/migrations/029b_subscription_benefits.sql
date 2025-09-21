-- Create subscription_benefits table for tracking monthly benefits
CREATE TABLE IF NOT EXISTS public.subscription_benefits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier subscription_tier NOT NULL,
  benefit_type VARCHAR(50) NOT NULL CHECK (benefit_type IN ('monthly_bump', 'priority_support', 'analytics')),
  benefit_value INTEGER NOT NULL DEFAULT 0,
  used_this_month INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one benefit per user per tier per type
  UNIQUE(user_id, subscription_tier, benefit_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_user_id ON public.subscription_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_tier ON public.subscription_benefits(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_type ON public.subscription_benefits(benefit_type);
CREATE INDEX IF NOT EXISTS idx_subscription_benefits_reset ON public.subscription_benefits(last_reset_at);

-- Enable RLS
ALTER TABLE public.subscription_benefits ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own benefits" ON public.subscription_benefits;
DROP POLICY IF EXISTS "Users can update their own benefits" ON public.subscription_benefits;
DROP POLICY IF EXISTS "Service role can manage all benefits" ON public.subscription_benefits;

CREATE POLICY "Users can view their own benefits" ON public.subscription_benefits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own benefits" ON public.subscription_benefits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all benefits" ON public.subscription_benefits
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger for updated_at (drop existing first)
DROP TRIGGER IF EXISTS update_subscription_benefits_updated_at ON public.subscription_benefits;
CREATE TRIGGER update_subscription_benefits_updated_at
  BEFORE UPDATE ON public.subscription_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to initialize subscription benefits for a user
CREATE OR REPLACE FUNCTION initialize_subscription_benefits(p_user_id UUID, p_subscription_tier subscription_tier)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    benefit_record RECORD;
BEGIN
    -- Delete existing benefits for this user and tier
    DELETE FROM subscription_benefits 
    WHERE user_id = p_user_id AND subscription_tier = p_subscription_tier;
    
    -- Insert default benefits based on tier
    CASE p_subscription_tier
        WHEN 'FREE' THEN
            INSERT INTO subscription_benefits (user_id, subscription_tier, benefit_type, benefit_value, monthly_limit)
            VALUES 
                (p_user_id, p_subscription_tier, 'monthly_bump', 0, 0);
                
        WHEN 'PLUS' THEN
            INSERT INTO subscription_benefits (user_id, subscription_tier, benefit_type, benefit_value, monthly_limit)
            VALUES 
                (p_user_id, p_subscription_tier, 'monthly_bump', 3, 3),
                (p_user_id, p_subscription_tier, 'priority_support', 1, 1);
                
        WHEN 'PRO' THEN
            INSERT INTO subscription_benefits (user_id, subscription_tier, benefit_type, benefit_value, monthly_limit)
            VALUES 
                (p_user_id, p_subscription_tier, 'monthly_bump', 10, 10),
                (p_user_id, p_subscription_tier, 'priority_support', 1, 1),
                (p_user_id, p_subscription_tier, 'analytics', 1, 1);
    END CASE;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION initialize_subscription_benefits(UUID, subscription_tier) TO service_role;

-- Update the monthly reset function to also reset subscription benefits
CREATE OR REPLACE FUNCTION reset_monthly_subscription_benefits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reset_count INTEGER := 0;
    user_record RECORD;
BEGIN
    -- Reset credits for all users based on their subscription tier
    FOR user_record IN 
        SELECT 
            uc.user_id,
            uc.subscription_tier,
            uc.monthly_allowance,
            uc.current_balance,
            uc.consumed_this_month
        FROM user_credits uc
        WHERE uc.last_reset_at < date_trunc('month', NOW())
    LOOP
        -- Update user credits with monthly allowance
        UPDATE user_credits 
        SET 
            current_balance = user_record.monthly_allowance,
            consumed_this_month = 0,
            last_reset_at = NOW(),
            updated_at = NOW()
        WHERE user_id = user_record.user_id;
        
        -- Log the reset transaction
        INSERT INTO credit_transactions (
            user_id,
            transaction_type,
            credits_used,
            enhancement_type,
            status,
            created_at
        ) VALUES (
            user_record.user_id,
            'monthly_reset',
            user_record.monthly_allowance,
            'monthly_allowance',
            'completed',
            NOW()
        );
        
        reset_count := reset_count + 1;
    END LOOP;
    
    -- Reset subscription benefits
    UPDATE subscription_benefits 
    SET 
        used_this_month = 0,
        last_reset_at = NOW(),
        updated_at = NOW()
    WHERE last_reset_at < date_trunc('month', NOW());
    
    RETURN reset_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION reset_monthly_subscription_benefits() TO service_role;
