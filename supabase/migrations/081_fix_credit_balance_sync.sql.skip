-- Fix credit balance synchronization between old and new schema
-- This migration ensures that the balance column is synced with current_balance

-- First, sync any existing balance data to current_balance
UPDATE user_credits 
SET current_balance = COALESCE(balance, 0)
WHERE current_balance IS NULL OR current_balance = 0;

-- Update the webhook function to use current_balance instead of balance
CREATE OR REPLACE FUNCTION update_user_credits_from_purchase(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT NULL,
    p_reference_id TEXT DEFAULT NULL
) RETURNS user_credits AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_user_credits user_credits;
BEGIN
    -- Get current balance (with lock)
    SELECT current_balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- If no record exists, create one
    IF v_current_balance IS NULL THEN
        INSERT INTO user_credits (user_id, current_balance, balance, lifetime_earned, lifetime_consumed)
        VALUES (p_user_id, 0, 0, 0, 0)
        RETURNING current_balance INTO v_current_balance;
    END IF;
    
    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;
    
    -- Check for negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits. Current balance: %, Requested: %', v_current_balance, ABS(p_amount);
    END IF;
    
    -- Update user_credits (both columns for compatibility)
    UPDATE user_credits
    SET 
        current_balance = v_new_balance,
        balance = v_new_balance, -- Keep both in sync
        lifetime_earned = lifetime_earned + p_amount,
        last_purchase_at = now(),
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_user_credits;
    
    -- Log transaction
    INSERT INTO credit_transactions (
        user_id, 
        transaction_type, 
        credits_used, 
        balance_before, 
        balance_after, 
        description, 
        reference_id
    ) VALUES (
        p_user_id,
        'purchase',
        p_amount,
        v_current_balance,
        v_new_balance,
        p_description,
        p_reference_id
    );
    
    RETURN v_user_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_credits_from_purchase TO service_role;

-- Create a trigger to keep both columns in sync
CREATE OR REPLACE FUNCTION sync_credit_balance_columns()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep both columns in sync
    IF TG_OP = 'UPDATE' THEN
        IF NEW.current_balance != OLD.current_balance THEN
            NEW.balance = NEW.current_balance;
        ELSIF NEW.balance != OLD.balance THEN
            NEW.current_balance = NEW.balance;
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        IF NEW.current_balance IS NOT NULL AND NEW.balance IS NULL THEN
            NEW.balance = NEW.current_balance;
        ELSIF NEW.balance IS NOT NULL AND NEW.current_balance IS NULL THEN
            NEW.current_balance = NEW.balance;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep columns in sync
DROP TRIGGER IF EXISTS sync_credit_balance_trigger ON user_credits;
CREATE TRIGGER sync_credit_balance_trigger
    BEFORE INSERT OR UPDATE ON user_credits
    FOR EACH ROW
    EXECUTE FUNCTION sync_credit_balance_columns();

-- Update any existing records to ensure both columns are in sync
UPDATE user_credits 
SET 
    current_balance = COALESCE(current_balance, balance, 0),
    balance = COALESCE(balance, current_balance, 0)
WHERE current_balance != balance OR current_balance IS NULL OR balance IS NULL;
