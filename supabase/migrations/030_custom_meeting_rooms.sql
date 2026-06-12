-- Meetings: creates church_meetings (if missing), attendance logs, and join/leave RPCs.
-- Safe to run even if 029 was skipped. No DROP statements.

-- Enum
DO $$ BEGIN
  CREATE TYPE meeting_status AS ENUM (
    'SCHEDULED',
    'LIVE',
    'ENDED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Core meetings table
CREATE TABLE IF NOT EXISTS church_meetings (
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

ALTER TABLE church_meetings ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE church_meetings ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Upgrade path: older 029 schema had required join_url
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'church_meetings'
      AND column_name = 'join_url'
  ) THEN
    ALTER TABLE church_meetings ALTER COLUMN join_url DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS church_meetings_scheduled_at_idx ON church_meetings(scheduled_at DESC);
CREATE INDEX IF NOT EXISTS church_meetings_share_slug_idx ON church_meetings(share_slug);
CREATE INDEX IF NOT EXISTS church_meetings_status_idx ON church_meetings(status);

DROP TRIGGER IF EXISTS church_meetings_updated_at ON church_meetings;
CREATE TRIGGER church_meetings_updated_at
  BEFORE UPDATE ON church_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE church_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "church_meetings_select" ON church_meetings;
CREATE POLICY "church_meetings_select" ON church_meetings FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

DROP POLICY IF EXISTS "church_meetings_insert" ON church_meetings;
CREATE POLICY "church_meetings_insert" ON church_meetings FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

DROP POLICY IF EXISTS "church_meetings_update" ON church_meetings;
CREATE POLICY "church_meetings_update" ON church_meetings FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

DROP POLICY IF EXISTS "church_meetings_delete" ON church_meetings;
CREATE POLICY "church_meetings_delete" ON church_meetings FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);

-- Attendance log
CREATE TABLE IF NOT EXISTS church_meeting_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id       UUID NOT NULL REFERENCES church_meetings(id) ON DELETE CASCADE,
  display_name     TEXT NOT NULL,
  profile_id       UUID REFERENCES profiles(id),
  client_session   TEXT,
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at          TIMESTAMPTZ,
  duration_seconds INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS church_meeting_participants_meeting_idx
  ON church_meeting_participants(meeting_id, joined_at DESC);

ALTER TABLE church_meeting_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meeting_participants_select_staff" ON church_meeting_participants;
CREATE POLICY "meeting_participants_select_staff" ON church_meeting_participants FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

-- Public + logging RPCs
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

CREATE OR REPLACE FUNCTION log_meeting_participant_join(
  p_slug TEXT,
  p_display_name TEXT,
  p_client_session TEXT DEFAULT NULL
)
RETURNS TABLE (
  participant_id UUID,
  meeting_id UUID,
  meeting_title TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meeting church_meetings%ROWTYPE;
  v_participant_id UUID;
  v_profile_id UUID;
BEGIN
  IF length(trim(p_display_name)) < 2 THEN
    RAISE EXCEPTION 'Display name is required';
  END IF;

  SELECT * INTO v_meeting
  FROM church_meetings
  WHERE share_slug = p_slug
    AND status IN ('SCHEDULED', 'LIVE')
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meeting not available';
  END IF;

  v_profile_id := auth.uid();

  IF v_meeting.status = 'SCHEDULED' THEN
    UPDATE church_meetings
    SET status = 'LIVE', started_at = COALESCE(started_at, NOW())
    WHERE id = v_meeting.id;
  END IF;

  INSERT INTO church_meeting_participants (meeting_id, display_name, profile_id, client_session)
  VALUES (v_meeting.id, trim(p_display_name), v_profile_id, p_client_session)
  RETURNING id INTO v_participant_id;

  RETURN QUERY
  SELECT v_participant_id, v_meeting.id, v_meeting.title;
END;
$$;

CREATE OR REPLACE FUNCTION log_meeting_participant_leave(p_participant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE church_meeting_participants
  SET
    left_at = NOW(),
    duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NOW() - joined_at))::INT)
  WHERE id = p_participant_id
    AND left_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_meeting_by_slug(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_meeting_participant_join(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_meeting_participant_leave(UUID) TO anon, authenticated;
