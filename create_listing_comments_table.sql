-- Create listing_comments table for public comments on listings
CREATE TABLE IF NOT EXISTS listing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES listing_comments(id) ON DELETE CASCADE, -- For replies
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listing_comments_listing_id ON listing_comments(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_comments_user_id ON listing_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_comments_parent_id ON listing_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_listing_comments_created_at ON listing_comments(created_at);

-- Create RLS policies
ALTER TABLE listing_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read comments
CREATE POLICY "Anyone can read listing comments" ON listing_comments
  FOR SELECT USING (true);

-- Policy: Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON listing_comments
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON listing_comments
  FOR UPDATE USING (
    user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON listing_comments
  FOR DELETE USING (
    user_id = (SELECT id FROM users_profile WHERE user_id = auth.uid())
  );

-- Add comment count to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create function to update comment count
CREATE OR REPLACE FUNCTION update_listing_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE listings 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE listings 
    SET comment_count = comment_count - 1 
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update comment count
DROP TRIGGER IF EXISTS trigger_update_listing_comment_count ON listing_comments;
CREATE TRIGGER trigger_update_listing_comment_count
  AFTER INSERT OR DELETE ON listing_comments
  FOR EACH ROW EXECUTE FUNCTION update_listing_comment_count();
