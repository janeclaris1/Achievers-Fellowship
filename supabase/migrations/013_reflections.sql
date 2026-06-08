-- Reflections: leader devotionals with admin approval

CREATE TYPE reflection_status AS ENUM (
  'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED'
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE TABLE reflections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  summary           TEXT,
  body              TEXT NOT NULL,
  scripture_ref     TEXT,
  scripture_passage TEXT,
  message_title     TEXT,
  message_url       TEXT,
  author_id         UUID NOT NULL REFERENCES profiles(id),
  status            reflection_status NOT NULL DEFAULT 'DRAFT',
  submitted_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  reviewed_by       UUID REFERENCES profiles(id),
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX reflections_status_idx ON reflections (status);
CREATE INDEX reflections_author_idx ON reflections (author_id);
CREATE INDEX reflections_published_at_idx ON reflections (published_at DESC NULLS LAST);

CREATE TRIGGER reflections_updated_at BEFORE UPDATE ON reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Published: all portal roles
CREATE POLICY "reflections_select_published" ON reflections FOR SELECT USING (
  status = 'PUBLISHED'
  AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

-- Authors see their own (any status)
CREATE POLICY "reflections_select_own" ON reflections FOR SELECT USING (
  author_id = auth.uid()
);

-- Admin sees everything
CREATE POLICY "reflections_select_admin" ON reflections FOR SELECT USING (
  get_my_role() = 'MASTER_ADMIN'
);

-- Leaders create their own reflections
CREATE POLICY "reflections_insert" ON reflections FOR INSERT WITH CHECK (
  author_id = auth.uid()
  AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE')
);

-- Authors update own drafts/rejected; admin can update any
CREATE POLICY "reflections_update_author" ON reflections FOR UPDATE USING (
  author_id = auth.uid()
  AND status IN ('DRAFT', 'REJECTED')
  AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE')
);

CREATE POLICY "reflections_update_admin" ON reflections FOR UPDATE USING (
  get_my_role() = 'MASTER_ADMIN'
);

-- Admin delete
CREATE POLICY "reflections_delete_admin" ON reflections FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);

-- Profile avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "profile_avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-avatars');

CREATE POLICY "profile_avatars_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_avatars_auth_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "profile_avatars_auth_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
