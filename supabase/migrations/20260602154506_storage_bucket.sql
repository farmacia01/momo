-- Set up Storage for Dose photos
INSERT INTO storage.buckets (id, name, public) VALUES ('doses', 'doses', true);

-- Allow authenticated users to upload files to the "doses" bucket
CREATE POLICY "Users can upload their own dose photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'doses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to view photos
CREATE POLICY "Anyone can view dose photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'doses');

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own dose photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'doses' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own dose photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'doses' AND (storage.foldername(name))[1] = auth.uid()::text);
