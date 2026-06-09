-- Comments and emoji reactions on published reflections

CREATE TABLE reflection_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id UUID NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id),
  body          TEXT NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX reflection_comments_reflection_idx ON reflection_comments (reflection_id, created_at);

CREATE TRIGGER reflection_comments_updated_at BEFORE UPDATE ON reflection_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE reflection_reactions (
  reflection_id UUID NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES profiles(id),
  emoji         TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '🙏', '🔥', '✨', '😊')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (reflection_id, profile_id)
);

CREATE INDEX reflection_reactions_reflection_idx ON reflection_reactions (reflection_id);

ALTER TABLE reflection_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_reactions ENABLE ROW LEVEL SECURITY;

-- Helper: published reflection visible to portal roles
CREATE OR REPLACE FUNCTION reflection_is_engagement_visible(reflection_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM reflections r
    WHERE r.id = reflection_uuid
    AND (
      (r.status = 'PUBLISHED' AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER'))
      OR r.author_id = auth.uid()
      OR get_my_role() = 'MASTER_ADMIN'
    )
  );
$$;

-- Comments
CREATE POLICY "reflection_comments_select" ON reflection_comments
  FOR SELECT USING (reflection_is_engagement_visible(reflection_id));

CREATE POLICY "reflection_comments_insert" ON reflection_comments
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reflections r
      WHERE r.id = reflection_id
      AND r.status = 'PUBLISHED'
      AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
    )
  );

CREATE POLICY "reflection_comments_delete" ON reflection_comments
  FOR DELETE USING (
    profile_id = auth.uid()
    OR get_my_role() = 'MASTER_ADMIN'
  );

-- Reactions
CREATE POLICY "reflection_reactions_select" ON reflection_reactions
  FOR SELECT USING (reflection_is_engagement_visible(reflection_id));

CREATE POLICY "reflection_reactions_insert" ON reflection_reactions
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reflections r
      WHERE r.id = reflection_id
      AND r.status = 'PUBLISHED'
      AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
    )
  );

CREATE POLICY "reflection_reactions_update" ON reflection_reactions
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "reflection_reactions_delete" ON reflection_reactions
  FOR DELETE USING (profile_id = auth.uid());
