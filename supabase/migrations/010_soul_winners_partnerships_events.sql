-- Soul win tracking, weekly senior-cell partnerships, and church events

CREATE TYPE church_event_status AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED');

CREATE TABLE soul_win_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  convert_name TEXT,
  notes       TEXT,
  won_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX soul_win_logs_member_id_idx ON soul_win_logs(member_id);
CREATE INDEX soul_win_logs_won_at_idx ON soul_win_logs(won_at DESC);

CREATE TABLE cell_group_weekly_partnerships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_group_id UUID NOT NULL REFERENCES cell_groups(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  amount        NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  notes         TEXT,
  recorded_by   UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cell_group_id, week_start)
);

CREATE INDEX cell_group_weekly_partnerships_week_idx
  ON cell_group_weekly_partnerships(week_start DESC);

CREATE TABLE church_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  event_date  TIMESTAMPTZ NOT NULL,
  location    TEXT,
  status      church_event_status DEFAULT 'UPCOMING',
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX church_events_event_date_idx ON church_events(event_date);

CREATE TRIGGER cell_group_weekly_partnerships_updated_at
  BEFORE UPDATE ON cell_group_weekly_partnerships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER church_events_updated_at
  BEFORE UPDATE ON church_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE soul_win_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_group_weekly_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "soul_win_logs_select" ON soul_win_logs FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

CREATE POLICY "soul_win_logs_insert_admin" ON soul_win_logs FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "soul_win_logs_update_admin" ON soul_win_logs FOR UPDATE USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "soul_win_logs_delete_admin" ON soul_win_logs FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "partnerships_select" ON cell_group_weekly_partnerships FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

CREATE POLICY "partnerships_insert_admin" ON cell_group_weekly_partnerships FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "partnerships_update_admin" ON cell_group_weekly_partnerships FOR UPDATE USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "partnerships_delete_admin" ON cell_group_weekly_partnerships FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "church_events_select" ON church_events FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);

CREATE POLICY "church_events_insert_admin" ON church_events FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "church_events_update_admin" ON church_events FOR UPDATE USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "church_events_delete_admin" ON church_events FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);
