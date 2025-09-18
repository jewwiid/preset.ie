-- Enhanced Showcase System Migration
-- Adds support for individual image showcases and improved filtering

-- First, create the visibility enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'showcase_visibility') THEN
        CREATE TYPE showcase_visibility AS ENUM ('public', 'private', 'unlisted');
    ELSE
        -- If enum exists but doesn't have the right values, drop and recreate
        DROP TYPE IF EXISTS showcase_visibility CASCADE;
        CREATE TYPE showcase_visibility AS ENUM ('public', 'private', 'unlisted');
    END IF;
END $$;

-- Drop existing tables if they exist to ensure clean creation
DROP TABLE IF EXISTS moodboard_items CASCADE;
DROP TABLE IF EXISTS moodboards CASCADE;

-- Ensure moodboards table exists (simplified version)
CREATE TABLE moodboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure moodboard_items table exists (simplified version)
CREATE TABLE moodboard_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  moodboard_id UUID NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing showcases table if it exists to ensure clean creation
DROP TABLE IF EXISTS showcases CASCADE;

-- Ensure showcases table exists with proper structure
CREATE TABLE showcases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  moodboard_id UUID REFERENCES moodboards(id) ON DELETE CASCADE,
  visibility showcase_visibility DEFAULT 'public',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- First, add the missing columns if they don't exist
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS media_count INTEGER DEFAULT 0;

ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Add showcase_type column to distinguish between moodboard and individual image showcases
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS showcase_type VARCHAR(20) DEFAULT 'moodboard' CHECK (showcase_type IN ('moodboard', 'individual_image'));

-- Add individual_image_url column for direct image showcases
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_url TEXT;

-- Add individual_image_title and individual_image_description for direct image showcases
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_title TEXT;
ALTER TABLE showcases 
ADD COLUMN IF NOT EXISTS individual_image_description TEXT;

-- Update the constraint to allow individual_image_url when showcase_type is 'individual_image'
ALTER TABLE showcases 
DROP CONSTRAINT IF EXISTS showcases_media_count_check;

ALTER TABLE showcases 
ADD CONSTRAINT showcases_media_count_check 
CHECK (
  (showcase_type = 'moodboard' AND media_count > 0) OR 
  (showcase_type = 'individual_image' AND media_count = 1 AND individual_image_url IS NOT NULL)
);

-- Update the constraint to require moodboard_id only for moodboard showcases
ALTER TABLE showcases 
DROP CONSTRAINT IF EXISTS showcases_moodboard_id_check;

ALTER TABLE showcases 
ADD CONSTRAINT showcases_moodboard_id_check 
CHECK (
  (showcase_type = 'moodboard' AND moodboard_id IS NOT NULL) OR 
  (showcase_type = 'individual_image' AND moodboard_id IS NULL)
);

-- Enable RLS on showcases table
ALTER TABLE showcases ENABLE ROW LEVEL SECURITY;

-- Create index for filtering by showcase type
CREATE INDEX IF NOT EXISTS idx_showcases_type ON showcases(showcase_type);
CREATE INDEX IF NOT EXISTS idx_showcases_type_visibility ON showcases(showcase_type, visibility);

-- Update RLS policies to handle both showcase types
DROP POLICY IF EXISTS "Users can view public showcases" ON showcases;
CREATE POLICY "Users can view public showcases" ON showcases
  FOR SELECT USING (visibility = 'public');

DROP POLICY IF EXISTS "Users can create their own showcases" ON showcases;
CREATE POLICY "Users can create their own showcases" ON showcases
  FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

DROP POLICY IF EXISTS "Users can update their own showcases" ON showcases;
CREATE POLICY "Users can update their own showcases" ON showcases
  FOR UPDATE USING (auth.uid() = creator_user_id);

DROP POLICY IF EXISTS "Users can delete their own showcases" ON showcases;
CREATE POLICY "Users can delete their own showcases" ON showcases
  FOR DELETE USING (auth.uid() = creator_user_id);

-- Drop existing showcase_media table if it exists
DROP TABLE IF EXISTS showcase_media CASCADE;

-- Update showcase_media table to handle individual image showcases
-- First ensure the table exists and has the required columns
CREATE TABLE showcase_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  moodboard_item_id UUID REFERENCES moodboard_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  tags TEXT[],
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the showcase_type column
ALTER TABLE showcase_media 
ADD COLUMN IF NOT EXISTS showcase_type VARCHAR(20) DEFAULT 'moodboard' CHECK (showcase_type IN ('moodboard', 'individual_image'));

-- For individual image showcases, we'll store the image directly in showcase_media
-- Update the constraint to allow individual_image_url when showcase_type is 'individual_image'
ALTER TABLE showcase_media 
DROP CONSTRAINT IF EXISTS showcase_media_image_url_check;

ALTER TABLE showcase_media 
ADD CONSTRAINT showcase_media_image_url_check 
CHECK (
  (showcase_type = 'moodboard' AND moodboard_item_id IS NOT NULL) OR 
  (showcase_type = 'individual_image' AND image_url IS NOT NULL AND moodboard_item_id IS NULL)
);

-- Create function to automatically create showcase_media entry for individual image showcases
CREATE OR REPLACE FUNCTION create_individual_image_showcase_media()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's an individual image showcase, create a showcase_media entry
  IF NEW.showcase_type = 'individual_image' AND NEW.individual_image_url IS NOT NULL THEN
    INSERT INTO showcase_media (
      showcase_id,
      image_url,
      title,
      description,
      tags,
      order_index,
      showcase_type
    ) VALUES (
      NEW.id,
      NEW.individual_image_url,
      NEW.individual_image_title,
      NEW.individual_image_description,
      NEW.tags,
      0,
      'individual_image'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create showcase_media for individual image showcases
DROP TRIGGER IF EXISTS trigger_create_individual_image_showcase_media ON showcases;
CREATE TRIGGER trigger_create_individual_image_showcase_media
  AFTER INSERT ON showcases
  FOR EACH ROW
  EXECUTE FUNCTION create_individual_image_showcase_media();

-- Drop existing likes tables if they exist
DROP TABLE IF EXISTS showcase_like_counts CASCADE;
DROP TABLE IF EXISTS showcase_likes CASCADE;

-- Ensure showcase_likes table exists
CREATE TABLE showcase_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  showcase_id UUID NOT NULL REFERENCES showcases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(showcase_id, user_id)
);

-- Ensure showcase_like_counts table exists
CREATE TABLE showcase_like_counts (
  showcase_id UUID PRIMARY KEY REFERENCES showcases(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update the like count trigger to handle both showcase types
CREATE OR REPLACE FUNCTION update_showcase_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Insert or update like count
    INSERT INTO showcase_like_counts (showcase_id, likes_count)
    VALUES (NEW.showcase_id, 1)
    ON CONFLICT (showcase_id) 
    DO UPDATE SET likes_count = showcase_like_counts.likes_count + 1;
    
    -- Update the likes_count in showcases table
    UPDATE showcases 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.showcase_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrease like count
    UPDATE showcase_like_counts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE showcase_id = OLD.showcase_id;
    
    -- Update the likes_count in showcases table
    UPDATE showcases 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.showcase_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes table
DROP TRIGGER IF EXISTS trigger_update_showcase_like_count ON showcase_likes;
CREATE TRIGGER trigger_update_showcase_like_count
  AFTER INSERT OR DELETE ON showcase_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_showcase_like_count();

-- Add RLS policies for showcase_likes table
ALTER TABLE showcase_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all likes" ON showcase_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" ON showcase_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" ON showcase_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for showcase_like_counts table
ALTER TABLE showcase_like_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all like counts" ON showcase_like_counts
  FOR SELECT USING (true);

-- Add RLS policies for showcase_media table
ALTER TABLE showcase_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all showcase media" ON showcase_media
  FOR SELECT USING (true);

CREATE POLICY "Users can create showcase media" ON showcase_media
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update showcase media" ON showcase_media
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete showcase media" ON showcase_media
  FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_showcase_media_type ON showcase_media(showcase_type);
CREATE INDEX IF NOT EXISTS idx_showcase_media_showcase_id ON showcase_media(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_likes_showcase_id ON showcase_likes(showcase_id);
CREATE INDEX IF NOT EXISTS idx_showcase_likes_user_id ON showcase_likes(user_id);

-- Add comments for documentation
COMMENT ON COLUMN showcases.showcase_type IS 'Type of showcase: moodboard or individual_image';
COMMENT ON COLUMN showcases.individual_image_url IS 'Direct image URL for individual image showcases';
COMMENT ON COLUMN showcases.individual_image_title IS 'Title for individual image showcases';
COMMENT ON COLUMN showcases.individual_image_description IS 'Description for individual image showcases';
COMMENT ON COLUMN showcase_media.showcase_type IS 'Type of showcase media: moodboard or individual_image';
