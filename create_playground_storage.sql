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

-- Create storage policies for playground-gallery bucket
DROP POLICY IF EXISTS "Users can upload to playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can view playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can update playground-gallery" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete playground-gallery" ON storage.objects;

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
