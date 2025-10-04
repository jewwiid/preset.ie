-- Add handle redirects table to manage username changes
-- This allows users to change their handles while maintaining SEO and user experience

CREATE TABLE user_handle_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    old_handle VARCHAR(50) NOT NULL,
    new_handle VARCHAR(50) NOT NULL,
    user_profile_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure old handles are unique (can't redirect to the same old handle twice)
    CONSTRAINT unique_old_handle UNIQUE (old_handle),
    
    -- Ensure we don't create redirect loops
    CONSTRAINT no_self_redirect CHECK (old_handle != new_handle),
    
    -- Ensure handles match the same format as users_profile
    CONSTRAINT old_handle_format CHECK (old_handle ~ '^[a-z0-9_]+$'),
    CONSTRAINT new_handle_format CHECK (new_handle ~ '^[a-z0-9_]+$')
);

-- Add index for fast lookups
CREATE INDEX idx_handle_redirects_old_handle ON user_handle_redirects(old_handle);
CREATE INDEX idx_handle_redirects_user_profile_id ON user_handle_redirects(user_profile_id);

-- Add RLS policies
ALTER TABLE user_handle_redirects ENABLE ROW LEVEL SECURITY;

-- Public read access for redirect lookups
CREATE POLICY "Public can read handle redirects" ON user_handle_redirects
    FOR SELECT USING (true);

-- Only the user themselves can create redirects (when they change their handle)
CREATE POLICY "Users can create their own handle redirects" ON user_handle_redirects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE users_profile.id = user_profile_id 
            AND users_profile.user_id = auth.uid()
        )
    );

-- Function to create a handle redirect when a user changes their handle
CREATE OR REPLACE FUNCTION create_handle_redirect()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create redirect if handle actually changed
    IF OLD.handle IS DISTINCT FROM NEW.handle THEN
        INSERT INTO user_handle_redirects (old_handle, new_handle, user_profile_id)
        VALUES (OLD.handle, NEW.handle, NEW.id)
        ON CONFLICT (old_handle) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create redirects when handles change
CREATE TRIGGER handle_change_redirect
    AFTER UPDATE OF handle ON users_profile
    FOR EACH ROW
    EXECUTE FUNCTION create_handle_redirect();

-- Function to get current handle from any handle (including old ones)
CREATE OR REPLACE FUNCTION resolve_current_handle(input_handle TEXT)
RETURNS TEXT AS $$
DECLARE
    current_handle TEXT;
BEGIN
    -- First check if it's a current handle
    IF EXISTS (SELECT 1 FROM users_profile WHERE handle = input_handle) THEN
        RETURN input_handle;
    END IF;
    
    -- Then check if it's an old handle that redirects
    SELECT new_handle INTO current_handle
    FROM user_handle_redirects
    WHERE old_handle = input_handle
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If we found a redirect, recursively resolve it (in case of multiple redirects)
    IF current_handle IS NOT NULL THEN
        RETURN resolve_current_handle(current_handle);
    END IF;
    
    -- No redirect found, return original
    RETURN input_handle;
END;
$$ language 'plpgsql' IMMUTABLE;
