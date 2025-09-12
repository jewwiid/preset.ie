-- Add missing columns for age verification
ALTER TABLE users_profile 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';

-- Add calculated_age column for easy age calculation
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS calculated_age INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN date_of_birth IS NOT NULL THEN 
      DATE_PART('year', AGE(CURRENT_DATE, date_of_birth))::INTEGER
    ELSE NULL
  END
) STORED;

-- Add age verification tracking columns
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_method TEXT,
ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0;

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

-- RLS policies for age_verification_logs
CREATE POLICY "Admin can view all logs" ON age_verification_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ));

CREATE POLICY "Admin can insert logs" ON age_verification_logs
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ));

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

-- Add test data for existing users
-- Note: These are sample birth dates for testing. Adjust as needed.
DO $$
DECLARE
  v_user RECORD;
  v_dates DATE[] := ARRAY[
    '1995-03-15'::DATE,  -- 29 years old
    '2000-07-22'::DATE,  -- 24 years old
    '1998-11-08'::DATE,  -- 26 years old
    '2008-04-10'::DATE,  -- 16 years old (minor for testing)
    '1992-09-30'::DATE   -- 32 years old
  ];
  v_index INTEGER := 1;
BEGIN
  -- Update existing users with test birth dates
  FOR v_user IN 
    SELECT user_id 
    FROM users_profile 
    WHERE date_of_birth IS NULL
    ORDER BY created_at
    LIMIT 5
  LOOP
    UPDATE users_profile
    SET 
      date_of_birth = v_dates[v_index],
      account_status = CASE 
        WHEN DATE_PART('year', AGE(CURRENT_DATE, v_dates[v_index])) >= 18 
        THEN 'active' 
        ELSE 'pending_verification' 
      END
    WHERE user_id = v_user.user_id;
    
    v_index := v_index + 1;
    EXIT WHEN v_index > array_length(v_dates, 1);
  END LOOP;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_profile_date_of_birth ON users_profile(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_users_profile_account_status ON users_profile(account_status);
CREATE INDEX IF NOT EXISTS idx_users_profile_age_verified ON users_profile(age_verified);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user_id ON age_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_created_at ON age_verification_logs(created_at DESC);