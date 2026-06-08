-- Track which published reflections each user has read

CREATE TABLE reflection_reads (
  profile_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reflection_id UUID NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  read_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, reflection_id)
);

CREATE INDEX reflection_reads_profile_idx ON reflection_reads (profile_id);

ALTER TABLE reflection_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reflection_reads_select_own" ON reflection_reads
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "reflection_reads_insert_own" ON reflection_reads
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "reflection_reads_update_own" ON reflection_reads
  FOR UPDATE USING (profile_id = auth.uid());
