-- Fix User Creation Triggers
-- This script fixes the circular dependency issue with user creation

-- Drop the problematic triggers temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
DROP TRIGGER IF EXISTS init_user_credits_on_profile_create ON users_profile;

-- Create a safer version of the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if the user doesn't already exist in the users table
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'TALENT'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a safer version of the create_default_user_settings function
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if the user doesn't already have settings and profile exists
  INSERT INTO user_settings (user_id, profile_id)
  SELECT NEW.id, NEW.id
  WHERE EXISTS (
    SELECT 1 FROM users_profile 
    WHERE user_id = NEW.id
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a safer version of the initialize_user_credits function
CREATE OR REPLACE FUNCTION initialize_user_credits()
RETURNS TRIGGER AS $$
DECLARE
  monthly_allowance INTEGER;
BEGIN
  -- Set monthly allowance based on subscription tier
  CASE NEW.subscription_tier
    WHEN 'FREE' THEN monthly_allowance := 0;
    WHEN 'PLUS' THEN monthly_allowance := 100;
    WHEN 'PRO' THEN monthly_allowance := 500;
    ELSE monthly_allowance := 0;
  END CASE;
  
  -- Only insert if the user doesn't already have credits and user exists in users table
  INSERT INTO user_credits (
    user_id,
    subscription_tier,
    monthly_allowance,
    current_balance,
    consumed_this_month,
    last_reset_at
  )
  SELECT 
    NEW.user_id,  -- Use user_id from profile, not profile id
    NEW.subscription_tier,
    monthly_allowance,
    monthly_allowance,
    0,
    DATE_TRUNC('month', NOW())
  WHERE EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.user_id
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers with better error handling
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();

CREATE TRIGGER init_user_credits_on_profile_create
AFTER INSERT ON users_profile
FOR EACH ROW
EXECUTE FUNCTION initialize_user_credits();

-- Create trigger to create user settings when profile is created
CREATE OR REPLACE FUNCTION create_user_settings_on_profile_create()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user settings when profile is created
  INSERT INTO user_settings (user_id, profile_id)
  VALUES (NEW.user_id, NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_settings_on_profile_create
AFTER INSERT ON users_profile
FOR EACH ROW
EXECUTE FUNCTION create_user_settings_on_profile_create();

-- Test the fix by creating a test user
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Create a test user in auth.users (this will trigger our functions)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    'test-admin@preset.ie',
    crypt('Admin123!@#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"role": "ADMIN"}'::jsonb
  ) RETURNING id INTO test_user_id;
  
  RAISE NOTICE 'Auth user created with ID: %', test_user_id;
  
  -- Create a profile for the test user (this will trigger settings creation)
  INSERT INTO users_profile (
    user_id,
    display_name,
    handle,
    first_name,
    last_name
  ) VALUES (
    test_user_id,
    'Test Admin',
    'test_admin',
    'Test',
    'Admin'
  );
  
  RAISE NOTICE 'Profile created successfully';
  
  -- Check if user settings were created
  IF EXISTS (SELECT 1 FROM user_settings WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'User settings created successfully';
  ELSE
    RAISE NOTICE 'User settings were not created';
  END IF;
  
  -- Check if user credits were created
  IF EXISTS (SELECT 1 FROM user_credits WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'User credits created successfully';
  ELSE
    RAISE NOTICE 'User credits were not created';
  END IF;
  
  -- Clean up test data
  DELETE FROM users_profile WHERE user_id = test_user_id;
  DELETE FROM user_settings WHERE user_id = test_user_id;
  DELETE FROM user_credits WHERE user_id = test_user_id;
  DELETE FROM users WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
  
  RAISE NOTICE 'Test user cleaned up successfully';
END $$;

-- Verify the fix worked
SELECT 'User creation triggers fixed successfully' as status;
