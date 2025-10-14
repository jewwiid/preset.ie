-- Add refund function that properly handles purchased vs subscription credits
-- This restores credits to the bucket they were consumed from

CREATE OR REPLACE FUNCTION refund_user_credits(
    p_user_id UUID,
    p_credits INTEGER,
    p_enhancement_type TEXT DEFAULT 'refund'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_credits RECORD;
    v_current_consumed INTEGER;
    v_subscription_refund INTEGER := 0;
    v_purchased_refund INTEGER := 0;
BEGIN
    -- Get current credit state
    SELECT * INTO v_user_credits
    FROM user_credits
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User credits not found';
    END IF;

    -- Strategy: Restore to subscription credits first (up to consumed_this_month)
    -- Then restore to purchased credits

    v_current_consumed := v_user_credits.consumed_this_month;

    IF v_current_consumed >= p_credits THEN
        -- All refund goes to subscription credits
        v_subscription_refund := p_credits;
    ELSE
        -- Some to subscription, rest to purchased
        v_subscription_refund := v_current_consumed;
        v_purchased_refund := p_credits - v_current_consumed;
    END IF;

    -- Update the balances
    UPDATE user_credits
    SET
        current_balance = current_balance + p_credits,
        purchased_credits_balance = purchased_credits_balance + v_purchased_refund,
        consumed_this_month = GREATEST(consumed_this_month - v_subscription_refund, 0),
        lifetime_consumed = GREATEST(lifetime_consumed - p_credits, 0),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Log refund transaction
    INSERT INTO credit_transactions (
        user_id,
        transaction_type,
        credits_used,
        enhancement_type,
        status,
        metadata,
        created_at
    ) VALUES (
        p_user_id,
        'refund',
        p_credits,
        p_enhancement_type,
        'completed',
        jsonb_build_object(
            'refund_breakdown', jsonb_build_object(
                'subscription_refund', v_subscription_refund,
                'purchased_refund', v_purchased_refund
            )
        ),
        NOW()
    );

    -- Return breakdown of refund
    RETURN jsonb_build_object(
        'total_refunded', p_credits,
        'subscription_refunded', v_subscription_refund,
        'purchased_refunded', v_purchased_refund,
        'new_balance', v_user_credits.current_balance + p_credits,
        'new_purchased_balance', v_user_credits.purchased_credits_balance + v_purchased_refund
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION refund_user_credits(UUID, INTEGER, TEXT) TO service_role;

COMMENT ON FUNCTION refund_user_credits IS
'Refund credits intelligently: restores to subscription credits first (up to consumed_this_month), then to purchased credits. This ensures proper rollover behavior.';
