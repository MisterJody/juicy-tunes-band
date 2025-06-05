-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('audio-files', 'audio-files', true),
  ('album-art', 'album-art', true),
  ('lyrics-files', 'lyrics-files', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for audio-files bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio-files');

CREATE POLICY "Authenticated users can upload audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  (storage.foldername(name))[1] = 'public' AND
  (storage.foldername(name))[2] = 'audio-files'
);

-- Set up storage policies for album-art bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'album-art');

CREATE POLICY "Authenticated users can upload album art"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'album-art' AND
  (storage.foldername(name))[1] = 'public' AND
  (storage.foldername(name))[2] = 'album-art'
);

-- Set up storage policies for lyrics-files bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'lyrics-files');

CREATE POLICY "Authenticated users can upload lyrics files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lyrics-files' AND
  (storage.foldername(name))[1] = 'public' AND
  (storage.foldername(name))[2] = 'lyrics-files'
); 