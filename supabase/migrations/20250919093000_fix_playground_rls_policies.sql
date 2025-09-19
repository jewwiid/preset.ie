-- Fix RLS policies for playground tables to allow service role operations
-- This allows the API to save generations using the service role key

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can manage own playground projects" ON playground_projects;
DROP POLICY IF EXISTS "Users can manage own playground gallery" ON playground_gallery;
DROP POLICY IF EXISTS "Users can manage own playground image edits" ON playground_image_edits;
DROP POLICY IF EXISTS "Users can manage own playground video generations" ON playground_video_generations;

-- Create new policies that allow service role operations
CREATE POLICY "Users can manage own playground projects" ON playground_projects
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Users can manage own playground gallery" ON playground_gallery
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Users can manage own playground image edits" ON playground_image_edits
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Users can manage own playground video generations" ON playground_video_generations
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.role() = 'service_role'
  );

-- Add comment for documentation
COMMENT ON POLICY "Users can manage own playground projects" ON playground_projects IS 'Allows users to manage their own projects and service role to perform admin operations';
COMMENT ON POLICY "Users can manage own playground gallery" ON playground_gallery IS 'Allows users to manage their own gallery and service role to perform admin operations';
COMMENT ON POLICY "Users can manage own playground image edits" ON playground_image_edits IS 'Allows users to manage their own edits and service role to perform admin operations';
COMMENT ON POLICY "Users can manage own playground video generations" ON playground_video_generations IS 'Allows users to manage their own video generations and service role to perform admin operations';
