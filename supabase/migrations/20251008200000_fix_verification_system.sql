-- Fix Verification System Issues
-- 1. Add 'age' to verification_type constraint
-- 2. Fix approve_verification_request function to not use is_active column

-- Drop the old constraint and add new one with 'age' type
ALTER TABLE verification_requests
DROP CONSTRAINT IF EXISTS verification_requests_verification_type_check;

ALTER TABLE verification_requests
ADD CONSTRAINT verification_requests_verification_type_check
CHECK (verification_type = ANY (ARRAY['age'::text, 'identity'::text, 'professional'::text, 'business'::text]));

-- Update approve_verification_request function to fix is_active reference
CREATE OR REPLACE FUNCTION public.approve_verification_request(
    p_request_id uuid,
    p_reviewer_id uuid,
    p_review_notes text DEFAULT NULL::text,
    p_badge_expires_in_days integer DEFAULT NULL::integer
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_verification_type TEXT;
    v_badge_type TEXT;
    v_badge_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Get request details
    SELECT user_id, verification_type INTO v_user_id, v_verification_type
    FROM verification_requests
    WHERE id = p_request_id
    AND status = 'pending';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Verification request not found or not pending';
    END IF;

    -- Determine badge type - map 'age' to 'identity'
    IF v_verification_type = 'age' THEN
        v_badge_type := 'verified_identity';
    ELSE
        v_badge_type := 'verified_' || v_verification_type;
    END IF;

    -- Calculate expiration
    IF p_badge_expires_in_days IS NOT NULL THEN
        v_expires_at := NOW() + (p_badge_expires_in_days || ' days')::INTERVAL;
    END IF;

    -- Update request status
    UPDATE verification_requests
    SET status = 'approved',
        reviewed_by = p_reviewer_id,
        review_notes = p_review_notes,
        reviewed_at = NOW()
    WHERE id = p_request_id;

    -- Revoke any existing badge of the same type (use revoked_at IS NULL instead of is_active)
    UPDATE verification_badges
    SET revoked_at = NOW(),
        revoked_by = p_reviewer_id,
        revoke_reason = 'Superseded by new verification'
    WHERE user_id = v_user_id
    AND badge_type = v_badge_type
    AND revoked_at IS NULL;

    -- Issue new badge
    INSERT INTO verification_badges (
        user_id,
        badge_type,
        verification_request_id,
        issued_by,
        expires_at
    ) VALUES (
        v_user_id,
        v_badge_type,
        p_request_id,
        p_reviewer_id,
        v_expires_at
    ) RETURNING id INTO v_badge_id;

    -- Update user profile with verification flag
    IF v_verification_type = 'identity' OR v_verification_type = 'age' THEN
        UPDATE users_profile
        SET verified_id = true
        WHERE user_id = v_user_id;
    ELSIF v_verification_type = 'professional' THEN
        UPDATE users_profile
        SET verified_id = true
        WHERE user_id = v_user_id;
    ELSIF v_verification_type = 'business' THEN
        UPDATE users_profile
        SET verified_id = true
        WHERE user_id = v_user_id;
    END IF;

    RETURN v_badge_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.approve_verification_request IS 'Approves a verification request and issues the appropriate badge. Maps age verification to identity badge.';
