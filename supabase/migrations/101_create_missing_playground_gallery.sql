-- Create missing playground_gallery table
-- This table stores user's saved images from the playground feature

-- Create playground-gallery storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playground-gallery',
  'playground-gallery', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Playground gallery table for user's saved images
CREATE TABLE IF NOT EXISTS playground_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES playground_projects(id) ON DELETE SET NULL,
    edit_id UUID, -- Reference to image edits if applicable
    
    -- Image details
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Image metadata
    width INTEGER DEFAULT 1024,
    height INTEGER DEFAULT 1024,
    file_size INTEGER DEFAULT 0,
    format VARCHAR(10) DEFAULT 'jpg',
    
    -- Generation metadata
    generation_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_playground_gallery_user_id ON playground_gallery(user_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_project_id ON playground_gallery(project_id);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_created_at ON playground_gallery(created_at);
CREATE INDEX IF NOT EXISTS idx_playground_gallery_image_url ON playground_gallery(image_url);

-- Enable RLS
ALTER TABLE playground_gallery ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own gallery items" ON playground_gallery;
DROP POLICY IF EXISTS "Users can create their own gallery items" ON playground_gallery;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON playground_gallery;
DROP POLICY IF EXISTS "Users can delete their own gallery items" ON playground_gallery;

CREATE POLICY "Users can view their own gallery items" ON playground_gallery
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gallery items" ON playground_gallery
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items" ON playground_gallery
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" ON playground_gallery
    FOR DELETE USING (auth.uid() = user_id);

-- Add comments for documentation
COMMENT ON TABLE playground_gallery IS 'Stores user-saved images from the playground feature';
COMMENT ON COLUMN playground_gallery.image_url IS 'URL of the saved image';
COMMENT ON COLUMN playground_gallery.generation_metadata IS 'JSON metadata about how the image was generated';
COMMENT ON COLUMN playground_gallery.project_id IS 'Reference to the playground project this image came from';
COMMENT ON COLUMN playground_gallery.tags IS 'Array of tags for organizing saved images';

-- Create storage policies for playground-gallery bucket (drop existing ones first)
DROP POLICY IF EXISTS "Users can upload to playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can view playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can update playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Public can view showcase images from playground" ON storage.objects;

CREATE POLICY "Users can upload to playground-gallery" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view playground-gallery" ON storage.objects
FOR SELECT USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update playground-gallery" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete playground-gallery" ON storage.objects
FOR DELETE USING (
  bucket_id = 'playground-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public can view images used in showcases (only if showcase_media table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'showcase_media') THEN
    CREATE POLICY "Public can view showcase images from playground" ON storage.objects
    FOR SELECT USING (
      bucket_id = 'playground-gallery' 
      AND EXISTS (
        SELECT 1 FROM showcase_media sm 
        WHERE sm.image_url LIKE '%' || name || '%'
      )
    );
  END IF;
END $$;
