-- Add email verification tracking to users_profile
ALTER TABLE users_profile
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for querying verified users
CREATE INDEX IF NOT EXISTS idx_users_profile_email_verified 
ON users_profile(email_verified);

-- Create trigger function to send welcome email after verification
CREATE OR REPLACE FUNCTION trigger_welcome_after_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only send welcome email if email was just verified
  IF NEW.email_verified = TRUE AND (OLD.email_verified IS NULL OR OLD.email_verified = FALSE) THEN
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

-- Drop old welcome email trigger (we'll send it after verification instead)
DROP TRIGGER IF EXISTS welcome_email_trigger ON users_profile;

-- Create new trigger for welcome email after verification
CREATE TRIGGER welcome_after_verification_trigger
AFTER UPDATE ON users_profile
FOR EACH ROW
WHEN (NEW.email_verified = TRUE AND (OLD.email_verified IS NULL OR OLD.email_verified = FALSE))
EXECUTE FUNCTION trigger_welcome_after_verification();

-- Create trigger for sending verification email on signup
CREATE OR REPLACE FUNCTION trigger_verification_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  verification_token TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Generate verification token (userId:timestamp:randomString)
  verification_token := NEW.user_id || ':' || EXTRACT(EPOCH FROM NOW())::BIGINT || ':' || substr(md5(random()::text), 1, 16);
  
  -- Send verification email
  PERFORM call_email_api(
    '/api/emails/verify-email',
    jsonb_build_object(
      'authUserId', NEW.user_id,
      'email', user_email,
      'name', NEW.display_name,
      'verificationToken', verification_token
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to send verification email on profile creation
CREATE TRIGGER verification_email_trigger
AFTER INSERT ON users_profile
FOR EACH ROW
EXECUTE FUNCTION trigger_verification_email();

COMMENT ON TRIGGER verification_email_trigger ON users_profile IS 
'Sends email verification email when a new user profile is created';

COMMENT ON TRIGGER welcome_after_verification_trigger ON users_profile IS 
'Sends welcome email after user verifies their email address';

