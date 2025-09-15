-- Enhanced Age Verification System
-- Adds proper age verification with date of birth and verification status

-- Add age verification fields to users_profile
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'pending_verification' 
  CHECK (account_status IN ('pending_verification', 'age_verified', 'fully_verified', 'suspended', 'banned')),
ADD COLUMN IF NOT EXISTS verification_method TEXT 
  CHECK (verification_method IN ('self_attestation', 'document_upload', 'third_party', 'admin_override'));

-- Create age verification logs table for audit trail
CREATE TABLE IF NOT EXISTS age_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('age', 'email', 'identity', 'professional')),
    verification_method TEXT NOT NULL,
    verified_by UUID REFERENCES auth.users(id),
    verification_data JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user ON age_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_type ON age_verification_logs(verification_type);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_age_verified ON users_profile(age_verified);

-- Function to calculate age from date of birth
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN DATE_PART('year', AGE(birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to verify user age
CREATE OR REPLACE FUNCTION verify_user_age(
    p_user_id UUID,
    p_date_of_birth DATE,
    p_method TEXT DEFAULT 'self_attestation',
    p_verified_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_age INTEGER;
    v_success BOOLEAN;
BEGIN
    -- Calculate age
    v_age := calculate_age(p_date_of_birth);
    
    -- Check if 18 or older
    v_success := v_age >= 18;
    
    IF v_success THEN
        -- Update user profile
        UPDATE users_profile
        SET 
            date_of_birth = p_date_of_birth,
            age_verified = true,
            age_verified_at = NOW(),
            verification_method = p_method,
            account_status = CASE 
                WHEN account_status = 'pending_verification' THEN 'age_verified'
                ELSE account_status
            END,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- Add verification badge if not exists
        IF NOT EXISTS (
            SELECT 1 FROM verification_badges 
            WHERE user_id = p_user_id 
            AND badge_type = 'verified_age' 
            AND revoked_at IS NULL
        ) THEN
            INSERT INTO verification_badges (
                user_id,
                badge_type,
                issued_by,
                issued_at
            ) VALUES (
                p_user_id,
                'verified_age',
                COALESCE(p_verified_by, p_user_id),
                NOW()
            );
        END IF;
    ELSE
        -- Update profile to show failed verification
        UPDATE users_profile
        SET 
            date_of_birth = p_date_of_birth,
            age_verified = false,
            account_status = 'suspended',
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    -- Log the verification attempt
    INSERT INTO age_verification_logs (
        user_id,
        verification_type,
        verification_method,
        verified_by,
        verification_data,
        success,
        failure_reason
    ) VALUES (
        p_user_id,
        'age',
        p_method,
        p_verified_by,
        jsonb_build_object(
            'date_of_birth', p_date_of_birth,
            'calculated_age', v_age
        ),
        v_success,
        CASE WHEN NOT v_success THEN 'Under 18 years old' ELSE NULL END
    );
    
    RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access feature based on verification
CREATE OR REPLACE FUNCTION can_access_feature(
    p_user_id UUID,
    p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_status TEXT;
    v_age_verified BOOLEAN;
BEGIN
    SELECT account_status, age_verified 
    INTO v_user_status, v_age_verified
    FROM users_profile
    WHERE user_id = p_user_id;
    
    -- Define feature access rules
    CASE p_feature
        WHEN 'view_gigs' THEN
            -- Anyone can view gigs
            RETURN true;
        WHEN 'create_profile' THEN
            -- Need email verification (basic)
            RETURN v_user_status != 'banned';
        WHEN 'apply_to_gigs' THEN
            -- Need age verification
            RETURN v_age_verified AND v_user_status NOT IN ('suspended', 'banned');
        WHEN 'create_gigs' THEN
            -- Need age verification
            RETURN v_age_verified AND v_user_status NOT IN ('suspended', 'banned');
        WHEN 'messaging' THEN
            -- Need age verification
            RETURN v_age_verified AND v_user_status NOT IN ('suspended', 'banned');
        WHEN 'create_showcases' THEN
            -- Need full verification
            RETURN v_user_status = 'fully_verified';
        ELSE
            -- Default: require age verification
            RETURN v_age_verified;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update verification_badges to include age verification
ALTER TABLE verification_badges
DROP CONSTRAINT IF EXISTS verification_badges_badge_type_check;

ALTER TABLE verification_badges
ADD CONSTRAINT verification_badges_badge_type_check 
CHECK (badge_type IN ('verified_age', 'verified_email', 'verified_identity', 'verified_professional', 'verified_business'));

-- Create view for admin dashboard
CREATE OR REPLACE VIEW admin_age_verification_queue AS
SELECT 
    up.user_id,
    up.display_name,
    up.handle,
    au.email,
    up.date_of_birth,
    calculate_age(up.date_of_birth) as calculated_age,
    up.age_verified,
    up.age_verified_at,
    up.account_status,
    up.verification_method,
    up.created_at,
    (
        SELECT COUNT(*) 
        FROM age_verification_logs 
        WHERE user_id = up.user_id 
        AND verification_type = 'age'
    ) as verification_attempts,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'type', badge_type,
                'issued_at', issued_at
            )
        )
        FROM verification_badges
        WHERE user_id = up.user_id
        AND revoked_at IS NULL
    ) as active_badges
FROM users_profile up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE up.date_of_birth IS NOT NULL
ORDER BY 
    CASE 
        WHEN up.account_status = 'pending_verification' THEN 1
        WHEN up.account_status = 'suspended' THEN 2
        ELSE 3
    END,
    up.created_at DESC;

-- RLS Policies
ALTER TABLE age_verification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification logs
CREATE POLICY user_view_own_logs ON age_verification_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all logs
CREATE POLICY admin_view_all_logs ON age_verification_logs
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT user_id FROM users_profile 
            WHERE 'ADMIN' = ANY(role_flags)
        )
    );

-- Only system can insert logs
CREATE POLICY system_insert_logs ON age_verification_logs
    FOR INSERT
    WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON age_verification_logs TO authenticated;
GRANT ALL ON age_verification_logs TO service_role;
GRANT SELECT ON admin_age_verification_queue TO authenticated;
GRANT EXECUTE ON FUNCTION verify_user_age TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_feature TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_age TO authenticated;