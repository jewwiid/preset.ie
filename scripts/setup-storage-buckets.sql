-- Create storage buckets for the application
-- This SQL needs to be run in the Supabase Dashboard

-- Create avatars bucket for profile pictures and header banners
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create moodboard-uploads bucket for moodboard images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moodboard-uploads', 'moodboard-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Storage policies for moodboard-uploads bucket
CREATE POLICY "Users can upload their own moodboard images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'moodboard-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own moodboard images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'moodboard-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own moodboard images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'moodboard-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
