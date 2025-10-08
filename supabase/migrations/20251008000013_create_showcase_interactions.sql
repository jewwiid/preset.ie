-- Create Showcase Interaction Tables
-- Enables likes and comments on showcases with notifications

-- ============================================
-- 1. SHOWCASE LIKES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS showcase_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(showcase_id, user_id)
);

-- Add likes_count column to showcases if it doesn't exist
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_showcase_likes_showcase ON showcase_likes(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_likes_user ON showcase_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_likes_created ON showcase_likes(created_at DESC);


-- ============================================
-- 2. SHOWCASE COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS showcase_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_id UUID REFERENCES showcase_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments_count column to showcases if it doesn't exist
ALTER TABLE showcases ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_showcase_comments_showcase ON showcase_comments(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_user ON showcase_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_parent ON showcase_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_showcase_comments_created ON showcase_comments(created_at DESC);


-- ============================================
-- 3. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE showcase_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_comments ENABLE ROW LEVEL SECURITY;

-- Likes: Anyone can view likes on public showcases
CREATE POLICY "Anyone can view showcase likes" ON showcase_likes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM showcases
      WHERE showcases.id = showcase_likes.showcase_id
      AND showcases.visibility = 'PUBLIC'
    )
  );

-- Likes: Users can like/unlike showcases
CREATE POLICY "Users can like showcases" ON showcase_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON showcase_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments: Anyone can view comments on public showcases
CREATE POLICY "Anyone can view showcase comments" ON showcase_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM showcases
      WHERE showcases.id = showcase_comments.showcase_id
      AND showcases.visibility = 'PUBLIC'
    )
  );

-- Comments: Users can comment on public showcases
CREATE POLICY "Users can comment on showcases" ON showcase_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM showcases
      WHERE showcases.id = showcase_comments.showcase_id
      AND showcases.visibility = 'PUBLIC'
    )
  );

-- Comments: Users can update their own comments
CREATE POLICY "Users can update own comments" ON showcase_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Comments: Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON showcase_comments
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 4. TRIGGERS FOR COUNT UPDATES
-- ============================================

-- Update likes count when likes are added/removed
CREATE OR REPLACE FUNCTION update_showcase_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE showcases
    SET likes_count = likes_count + 1,
        updated_at = NOW()
    WHERE id = NEW.showcase_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE showcases
    SET likes_count = GREATEST(likes_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.showcase_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_showcase_likes_count_insert ON showcase_likes;
CREATE TRIGGER trigger_update_showcase_likes_count_insert
  AFTER INSERT ON showcase_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_showcase_likes_count();

DROP TRIGGER IF EXISTS trigger_update_showcase_likes_count_delete ON showcase_likes;
CREATE TRIGGER trigger_update_showcase_likes_count_delete
  AFTER DELETE ON showcase_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_showcase_likes_count();

-- Update comments count when comments are added/removed
CREATE OR REPLACE FUNCTION update_showcase_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE showcases
    SET comments_count = comments_count + 1,
        updated_at = NOW()
    WHERE id = NEW.showcase_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE showcases
    SET comments_count = GREATEST(comments_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.showcase_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_showcase_comments_count_insert ON showcase_comments;
CREATE TRIGGER trigger_update_showcase_comments_count_insert
  AFTER INSERT ON showcase_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_showcase_comments_count();

DROP TRIGGER IF EXISTS trigger_update_showcase_comments_count_delete ON showcase_comments;
CREATE TRIGGER trigger_update_showcase_comments_count_delete
  AFTER DELETE ON showcase_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_showcase_comments_count();


-- ============================================
-- 5. NOTIFICATION TRIGGERS
-- ============================================

-- Activate showcase like notifications
DROP TRIGGER IF EXISTS trigger_notify_showcase_liked ON showcase_likes;
CREATE TRIGGER trigger_notify_showcase_liked
  AFTER INSERT ON showcase_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_showcase_liked();

-- Activate showcase comment notifications
DROP TRIGGER IF EXISTS trigger_notify_showcase_comment ON showcase_comments;
CREATE TRIGGER trigger_notify_showcase_comment
  AFTER INSERT ON showcase_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_showcase_comment();


-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE showcase_likes IS
  'Tracks which users have liked which showcases';

COMMENT ON TABLE showcase_comments IS
  'User comments on showcases with support for nested replies';

COMMENT ON COLUMN showcases.likes_count IS
  'Cached count of total likes for this showcase';

COMMENT ON COLUMN showcases.comments_count IS
  'Cached count of total comments for this showcase';


-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Count showcase notification triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND event_object_table IN ('showcase_likes', 'showcase_comments')
  AND trigger_name LIKE 'trigger_notify_%';

  RAISE NOTICE '✅ Showcase interaction tables created successfully';
  RAISE NOTICE '✅ % showcase notification triggers activated', trigger_count;
END $$;
