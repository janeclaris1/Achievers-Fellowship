-- Welfare department event gallery (birthdays, weddings, etc.)

ALTER TABLE welfare_programs
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

CREATE TABLE IF NOT EXISTS welfare_program_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES welfare_programs(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS welfare_program_images_program_idx
  ON welfare_program_images(program_id, sort_order);

ALTER TABLE welfare_program_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "welfare_program_images_select" ON welfare_program_images;
CREATE POLICY "welfare_program_images_select" ON welfare_program_images FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

DROP POLICY IF EXISTS "welfare_program_images_insert" ON welfare_program_images;
CREATE POLICY "welfare_program_images_insert" ON welfare_program_images FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

DROP POLICY IF EXISTS "welfare_program_images_update" ON welfare_program_images;
CREATE POLICY "welfare_program_images_update" ON welfare_program_images FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

DROP POLICY IF EXISTS "welfare_program_images_delete" ON welfare_program_images;
CREATE POLICY "welfare_program_images_delete" ON welfare_program_images FOR DELETE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('welfare-gallery', 'welfare-gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "welfare_gallery_public_read" ON storage.objects;
CREATE POLICY "welfare_gallery_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'welfare-gallery');

DROP POLICY IF EXISTS "welfare_gallery_auth_upload" ON storage.objects;
CREATE POLICY "welfare_gallery_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'welfare-gallery'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "welfare_gallery_auth_update" ON storage.objects;
CREATE POLICY "welfare_gallery_auth_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'welfare-gallery'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "welfare_gallery_auth_delete" ON storage.objects;
CREATE POLICY "welfare_gallery_auth_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'welfare-gallery'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
