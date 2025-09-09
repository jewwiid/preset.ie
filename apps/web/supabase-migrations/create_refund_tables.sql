-- Create refund policies table
CREATE TABLE IF NOT EXISTS refund_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_code TEXT UNIQUE NOT NULL,
    error_type TEXT NOT NULL,
    should_refund BOOLEAN DEFAULT true,
    refund_percentage INTEGER DEFAULT 100 CHECK (refund_percentage >= 0 AND refund_percentage <= 100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create credit refunds table (refund audit log)
CREATE TABLE IF NOT EXISTS credit_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    credits_refunded INTEGER NOT NULL CHECK (credits_refunded > 0),
    platform_credits_lost INTEGER DEFAULT 0,
    refund_reason TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add refund tracking columns to enhancement_tasks if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enhancement_tasks') THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'enhancement_tasks' AND column_name = 'refund_status') THEN
            ALTER TABLE enhancement_tasks 
            ADD COLUMN refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'completed', 'failed'));
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'enhancement_tasks' AND column_name = 'refund_credits') THEN
            ALTER TABLE enhancement_tasks 
            ADD COLUMN refund_credits INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'enhancement_tasks' AND column_name = 'refund_reason') THEN
            ALTER TABLE enhancement_tasks 
            ADD COLUMN refund_reason TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'enhancement_tasks' AND column_name = 'refunded_at') THEN
            ALTER TABLE enhancement_tasks 
            ADD COLUMN refunded_at TIMESTAMPTZ;
        END IF;
    END IF;
END $$;

-- Insert default refund policies
INSERT INTO refund_policies (error_code, error_type, should_refund, refund_percentage, description)
VALUES 
    ('400', 'content_policy_violation', true, 100, 'Content violates platform policies'),
    ('500', 'internal_error', true, 100, 'Internal server error during processing'),
    ('501', 'generation_failed', true, 100, 'Image generation failed'),
    ('storage_error', 'storage_error', true, 100, 'Failed to save enhanced image'),
    ('timeout', 'timeout', true, 100, 'Processing timeout exceeded'),
    ('user_cancelled', 'user_cancelled', false, 0, 'User cancelled the enhancement'),
    ('invalid_input', 'invalid_input', false, 0, 'Invalid input parameters provided')
ON CONFLICT (error_code) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_refunds_user_id ON credit_refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_refunds_task_id ON credit_refunds(task_id);
CREATE INDEX IF NOT EXISTS idx_credit_refunds_created_at ON credit_refunds(created_at DESC);

-- Create RLS policies for credit_refunds
ALTER TABLE credit_refunds ENABLE ROW LEVEL SECURITY;

-- Admin can read all refunds
CREATE POLICY "Admin can read all refunds" ON credit_refunds
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Users can read their own refunds
CREATE POLICY "Users can read own refunds" ON credit_refunds
    FOR SELECT
    USING (user_id = auth.uid());

-- Only system can insert refunds (via service role)
CREATE POLICY "System can insert refunds" ON credit_refunds
    FOR INSERT
    WITH CHECK (true);

-- Create RLS policies for refund_policies
ALTER TABLE refund_policies ENABLE ROW LEVEL SECURITY;

-- Everyone can read refund policies
CREATE POLICY "Public can read refund policies" ON refund_policies
    FOR SELECT
    USING (true);

-- Only admin can modify refund policies
CREATE POLICY "Admin can modify refund policies" ON refund_policies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users_profile
            WHERE user_id = auth.uid()
            AND 'ADMIN' = ANY(role_flags)
        )
    );

-- Create function to process refunds
CREATE OR REPLACE FUNCTION process_credit_refund(
    p_task_id TEXT,
    p_user_id UUID,
    p_credits_to_refund INTEGER,
    p_platform_loss INTEGER,
    p_reason TEXT,
    p_error_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_refund_id UUID;
    v_current_balance INTEGER;
BEGIN
    -- Get current user balance
    SELECT balance INTO v_current_balance
    FROM user_credits
    WHERE user_id = p_user_id;
    
    -- Create refund record
    INSERT INTO credit_refunds (
        task_id,
        user_id,
        credits_refunded,
        platform_credits_lost,
        refund_reason,
        error_code
    ) VALUES (
        p_task_id,
        p_user_id,
        p_credits_to_refund,
        p_platform_loss,
        p_reason,
        p_error_code
    ) RETURNING id INTO v_refund_id;
    
    -- Update user credits (add refunded credits back)
    UPDATE user_credits
    SET 
        balance = balance + p_credits_to_refund,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    -- Update enhancement task if it exists
    UPDATE enhancement_tasks
    SET 
        refund_status = 'completed',
        refund_credits = p_credits_to_refund,
        refund_reason = p_reason,
        refunded_at = now()
    WHERE task_id = p_task_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'refund_id', v_refund_id,
        'credits_refunded', p_credits_to_refund,
        'new_balance', v_current_balance + p_credits_to_refund
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON refund_policies TO anon, authenticated;
GRANT SELECT ON credit_refunds TO authenticated;
GRANT EXECUTE ON FUNCTION process_credit_refund TO authenticated, service_role;