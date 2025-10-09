-- Clean up old triggers
DROP TRIGGER IF EXISTS welcome_email_trigger ON users_profile;
DROP TRIGGER IF EXISTS verification_email_trigger ON users_profile;
DROP TRIGGER IF EXISTS welcome_after_verification_trigger ON users_profile;

-- Ensure email verification columns exist
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for querying verified users
CREATE INDEX IF NOT EXISTS idx_users_profile_email_verified 
ON users_profile(email_verified);

-- Update existing profiles to be verified (migration safety)
UPDATE users_profile 
SET email_verified = TRUE, 
    email_verified_at = created_at
WHERE email_verified IS NULL OR email_verified = FALSE;

-- Create trigger function to send welcome email when verified profile is created
CREATE OR REPLACE FUNCTION trigger_welcome_after_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only send welcome email if profile is created with email verified
  IF NEW.email_verified = TRUE THEN
    PERFORM call_email_api(
      '/api/emails/welcome-verified',
      jsonb_build_object(
        'authUserId', NEW.user_id,
        'email', (SELECT email FROM auth.users WHERE id = NEW.user_id),
        'name', NEW.display_name,
        'role', (
          CASE 
            WHEN 'CONTRIBUTOR' = ANY(NEW.role_flags) AND 'TALENT' = ANY(NEW.role_flags) THEN 'BOTH'
            WHEN 'CONTRIBUTOR' = ANY(NEW.role_flags) THEN 'CONTRIBUTOR'
            ELSE 'TALENT'
          END
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for welcome email when verified profile is created
CREATE TRIGGER welcome_after_verification_trigger
AFTER INSERT ON users_profile
FOR EACH ROW
WHEN (NEW.email_verified = TRUE)
EXECUTE FUNCTION trigger_welcome_after_verification();

COMMENT ON TRIGGER welcome_after_verification_trigger ON users_profile IS 
'Sends welcome email when a new profile is created with email already verified (after user clicks verification link)';

COMMENT ON FUNCTION trigger_welcome_after_verification IS
'NEW FLOW: Verification email is sent from signup API. Profile is created from /api/auth/verify after user clicks verification link. This trigger sends welcome email when that verified profile is created.';

