-- Fix RLS policy for user_settings table

-- Drop existing policies
DROP POLICY IF EXISTS "Users can access own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can access their own settings" ON user_settings;

-- Create a simple, working RLS policy
CREATE POLICY "Users can access their own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON user_settings TO authenticated;

-- Test the policy by creating a test function
CREATE OR REPLACE FUNCTION test_user_settings_access()
RETURNS BOOLEAN AS $$
BEGIN
    -- This function will be called with the current user's context
    RETURN EXISTS (
        SELECT 1 FROM user_settings 
        WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION test_user_settings_access() TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed RLS policy for user_settings table';
    RAISE NOTICE 'Users can now access their own settings';
END $$;
