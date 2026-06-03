-- Migration: 20260602240000_product_photos_bucket.sql
-- Description: Storage bucket for product photos.

INSERT INTO storage.buckets (id, name, public) VALUES ('produto-fotos', 'produto-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for "produto-fotos"
CREATE POLICY "Public can view product photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produto-fotos');

CREATE POLICY "Authenticated users can upload product photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'produto-fotos');

CREATE POLICY "Authenticated users can update product photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'produto-fotos');
