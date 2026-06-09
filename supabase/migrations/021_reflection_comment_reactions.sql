-- Emoji reactions on individual reflection comments

CREATE TABLE reflection_comment_reactions (
  comment_id  UUID NOT NULL REFERENCES reflection_comments(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id),
  emoji       TEXT NOT NULL CHECK (emoji IN ('👍', '❤️', '🙏', '🔥', '✨', '😊')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_id, profile_id)
);

CREATE INDEX reflection_comment_reactions_comment_idx ON reflection_comment_reactions (comment_id);

ALTER TABLE reflection_comment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reflection_comment_reactions_select" ON reflection_comment_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reflection_comments c
      WHERE c.id = comment_id
      AND reflection_is_engagement_visible(c.reflection_id)
    )
  );

CREATE POLICY "reflection_comment_reactions_insert" ON reflection_comment_reactions
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM reflection_comments c
      JOIN reflections r ON r.id = c.reflection_id
      WHERE c.id = comment_id
      AND r.status = 'PUBLISHED'
      AND get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
    )
  );

CREATE POLICY "reflection_comment_reactions_update" ON reflection_comment_reactions
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "reflection_comment_reactions_delete" ON reflection_comment_reactions
  FOR DELETE USING (profile_id = auth.uid());
