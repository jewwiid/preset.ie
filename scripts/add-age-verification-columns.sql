-- Add age verification columns to users_profile table
-- Run this in Supabase Dashboard SQL Editor

-- Add missing columns for age verification
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0;

-- Add check constraint for account_status
ALTER TABLE users_profile 
ADD CONSTRAINT users_profile_account_status_check 
CHECK (account_status IN ('active', 'pending_verification', 'age_verified', 'fully_verified', 'suspended', 'banned'));

-- Add check constraint for verification_method
ALTER TABLE users_profile 
ADD CONSTRAINT users_profile_verification_method_check 
CHECK (verification_method IN ('self_attestation', 'document_upload', 'third_party', 'admin_override'));

-- Create age_verification_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS age_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL,
  verification_method TEXT,
  verified_by UUID REFERENCES auth.users(id),
  success BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on age_verification_logs
ALTER TABLE age_verification_logs ENABLE ROW LEVEL SECURITY;

-- Function to verify user age
CREATE OR REPLACE FUNCTION verify_user_age(
  p_user_id UUID,
  p_date_of_birth DATE,
  p_method TEXT DEFAULT 'manual',
  p_verified_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_age INTEGER;
  v_success BOOLEAN;
BEGIN
  -- Calculate age
  v_age := DATE_PART('year', AGE(CURRENT_DATE, p_date_of_birth))::INTEGER;
  
  -- Check if user is 18 or older
  IF v_age >= 18 THEN
    -- Update user profile
    UPDATE users_profile
    SET 
      date_of_birth = p_date_of_birth,
      age_verified = TRUE,
      age_verified_at = NOW(),
      verification_method = p_method,
      account_status = 'active'
    WHERE user_id = p_user_id;
    
    v_success := TRUE;
  ELSE
    -- User is under 18, suspend account
    UPDATE users_profile
    SET 
      date_of_birth = p_date_of_birth,
      age_verified = FALSE,
      verification_method = p_method,
      account_status = 'suspended'
    WHERE user_id = p_user_id;
    
    v_success := FALSE;
  END IF;
  
  -- Log the verification attempt
  INSERT INTO age_verification_logs (
    user_id,
    verification_type,
    verification_method,
    verified_by,
    success,
    failure_reason
  ) VALUES (
    p_user_id,
    'age',
    p_method,
    p_verified_by,
    v_success,
    CASE WHEN NOT v_success THEN 'User is under 18 years old' ELSE NULL END
  );
  
  -- Increment verification attempts
  UPDATE users_profile
  SET verification_attempts = COALESCE(verification_attempts, 0) + 1
  WHERE user_id = p_user_id;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_user_age TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_date_of_birth ON users_profile(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_age_verified ON users_profile(age_verified);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user_id ON age_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_created_at ON age_verification_logs(created_at DESC);

-- Add test birth dates to existing users
UPDATE users_profile SET 
  date_of_birth = CASE 
    WHEN display_name = 'Admin User' THEN '1995-03-15'::DATE  -- 29 years old
    WHEN handle LIKE 'test_%' AND id = (SELECT id FROM users_profile WHERE handle LIKE 'test_%' ORDER BY created_at LIMIT 1 OFFSET 0) THEN '2000-07-22'::DATE  -- 24 years old
    WHEN handle LIKE 'test_%' AND id = (SELECT id FROM users_profile WHERE handle LIKE 'test_%' ORDER BY created_at LIMIT 1 OFFSET 1) THEN '1998-11-08'::DATE  -- 26 years old
    WHEN handle LIKE 'test_%' AND id = (SELECT id FROM users_profile WHERE handle LIKE 'test_%' ORDER BY created_at LIMIT 1 OFFSET 2) THEN '1992-09-30'::DATE  -- 32 years old
    WHEN handle LIKE 'test_%' AND id = (SELECT id FROM users_profile WHERE handle LIKE 'test_%' ORDER BY created_at LIMIT 1 OFFSET 3) THEN '1997-12-05'::DATE  -- 27 years old
    WHEN handle LIKE 'test_%' AND id = (SELECT id FROM users_profile WHERE handle LIKE 'test_%' ORDER BY created_at LIMIT 1 OFFSET 4) THEN '2001-08-18'::DATE  -- 23 years old
    WHEN handle LIKE 'test_%' AND id = (SELECT id FROM users_profile WHERE handle LIKE 'test_%' ORDER BY created_at LIMIT 1 OFFSET 5) THEN '1990-05-25'::DATE  -- 34 years old
    WHEN display_name = 'Alex Rivera' THEN '1988-06-03'::DATE  -- 36 years old
    WHEN display_name = 'Marcus Chen' THEN '2008-04-10'::DATE  -- 16 years old (minor for testing)
    ELSE date_of_birth
  END,
  account_status = CASE
    WHEN display_name = 'Marcus Chen' THEN 'pending_verification'  -- minor
    ELSE 'active'
  END,
  age_verified = CASE
    WHEN display_name = 'Marcus Chen' THEN FALSE  -- minor
    ELSE TRUE
  END,
  age_verified_at = CASE
    WHEN display_name = 'Marcus Chen' THEN NULL  -- minor
    ELSE NOW()
  END,
  verification_method = CASE
    WHEN display_name = 'Marcus Chen' THEN NULL  -- minor
    ELSE 'self_attestation'
  END
WHERE date_of_birth IS NULL;

-- Display results
SELECT 
  display_name,
  handle,
  date_of_birth,
  DATE_PART('year', AGE(CURRENT_DATE, date_of_birth))::INTEGER as calculated_age,
  account_status,
  age_verified,
  subscription_tier
FROM users_profile 
WHERE date_of_birth IS NOT NULL
ORDER BY created_at DESC;