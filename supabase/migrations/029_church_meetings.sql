-- In-app church meetings with shareable join links (no external Zoom/Meet)

CREATE TYPE meeting_status AS ENUM (
  'SCHEDULED',
  'LIVE',
  'ENDED',
  'CANCELLED'
);

CREATE TABLE church_meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  share_slug   TEXT NOT NULL UNIQUE,
  status       meeting_status DEFAULT 'SCHEDULED',
  started_at   TIMESTAMPTZ,
  ended_at     TIMESTAMPTZ,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX church_meetings_scheduled_at_idx ON church_meetings(scheduled_at DESC);
CREATE INDEX church_meetings_share_slug_idx ON church_meetings(share_slug);
CREATE INDEX church_meetings_status_idx ON church_meetings(status);

CREATE TRIGGER church_meetings_updated_at
  BEFORE UPDATE ON church_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE church_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_meetings_select" ON church_meetings FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

CREATE POLICY "church_meetings_insert" ON church_meetings FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

CREATE POLICY "church_meetings_update" ON church_meetings FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

CREATE POLICY "church_meetings_delete" ON church_meetings FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE OR REPLACE FUNCTION get_public_meeting_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  share_slug TEXT,
  status meeting_status,
  started_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    m.id,
    m.title,
    m.description,
    m.scheduled_at,
    m.share_slug,
    m.status,
    m.started_at
  FROM church_meetings m
  WHERE m.share_slug = p_slug
    AND m.status IN ('SCHEDULED', 'LIVE');
$$;

GRANT EXECUTE ON FUNCTION get_public_meeting_by_slug(TEXT) TO anon, authenticated;
