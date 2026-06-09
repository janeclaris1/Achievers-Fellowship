-- Reflection cover / post image

ALTER TABLE reflections
  ADD COLUMN IF NOT EXISTS post_image_url TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('reflection-images', 'reflection-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "reflection_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'reflection-images');

CREATE POLICY "reflection_images_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reflection-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "reflection_images_auth_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'reflection-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "reflection_images_auth_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reflection-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
