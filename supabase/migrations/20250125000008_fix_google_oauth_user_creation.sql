-- Fix Google OAuth user creation by adding missing INSERT policy for users table
-- This allows the handle_new_user() function to insert new users during OAuth signup

-- Add INSERT policy for users table (allows function to create new users)
CREATE POLICY "Allow user creation during signup"
  ON users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Update the handle_new_user function to handle Google OAuth metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'TALENT'
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- User already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add comment explaining the fix
COMMENT ON POLICY "Allow user creation during signup" ON users IS 'Allows the handle_new_user() function to create new user records during OAuth signup';
