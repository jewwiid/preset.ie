-- Create function to reset monthly subscription benefits
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
    
    -- Note: subscription_benefits table doesn't exist yet, skipping that part
    
    RETURN reset_count;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION reset_monthly_subscription_benefits() TO service_role;

-- Create a trigger to automatically initialize credits for new users
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_subscription_tier VARCHAR(20) := 'FREE';
BEGIN
    -- Get user's subscription tier from profile
    SELECT subscription_tier INTO user_subscription_tier
    FROM users_profile 
    WHERE user_id = NEW.id;
    
    -- If no profile exists, default to FREE
    IF user_subscription_tier IS NULL THEN
        user_subscription_tier := 'FREE';
    END IF;
    
    -- Insert user credits record
    INSERT INTO user_credits (
        user_id,
        subscription_tier,
        monthly_allowance,
        current_balance,
        consumed_this_month,
        last_reset_at,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_subscription_tier,
        CASE 
            WHEN user_subscription_tier = 'PRO' THEN 200
            WHEN user_subscription_tier = 'PLUS' THEN 50
            ELSE 5
        END,
        CASE 
            WHEN user_subscription_tier = 'PRO' THEN 200
            WHEN user_subscription_tier = 'PLUS' THEN 50
            ELSE 5
        END,
        0,
        NOW(),
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to initialize credits when a new user is created
DROP TRIGGER IF EXISTS trigger_initialize_user_credits ON auth.users;
CREATE TRIGGER trigger_initialize_user_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_credits();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION initialize_user_credits() TO service_role;
