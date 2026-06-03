-- Migration: 20260602220000_storage_reviews.sql
-- Description: Storage bucket for product review photos.

INSERT INTO storage.buckets (id, name, public) VALUES ('avaliacoes-fotos', 'avaliacoes-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for "avaliacoes-fotos"
CREATE POLICY "Users can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avaliacoes-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avaliacoes-fotos');
