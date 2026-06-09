-- Always store and return commenter display names

ALTER TABLE reflection_comments
  ADD COLUMN IF NOT EXISTS author_name TEXT;

UPDATE reflection_comments c
SET author_name = p.full_name
FROM profiles p
WHERE c.profile_id = p.id
  AND (c.author_name IS NULL OR trim(c.author_name) = '');

CREATE OR REPLACE FUNCTION set_reflection_comment_author_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.author_name IS NULL OR trim(NEW.author_name) = '' THEN
    SELECT full_name INTO NEW.author_name
    FROM profiles
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reflection_comments_set_author_name ON reflection_comments;
CREATE TRIGGER reflection_comments_set_author_name
  BEFORE INSERT OR UPDATE ON reflection_comments
  FOR EACH ROW EXECUTE FUNCTION set_reflection_comment_author_name();

CREATE OR REPLACE FUNCTION get_reflection_comments(p_reflection_id UUID)
RETURNS TABLE (
  id UUID,
  reflection_id UUID,
  profile_id UUID,
  body TEXT,
  author_name TEXT,
  author_avatar_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.reflection_id,
    c.profile_id,
    c.body,
    COALESCE(NULLIF(trim(c.author_name), ''), p.full_name, 'Member') AS author_name,
    p.avatar_url AS author_avatar_url,
    c.created_at,
    c.updated_at
  FROM reflection_comments c
  JOIN profiles p ON p.id = c.profile_id
  WHERE c.reflection_id = p_reflection_id
    AND reflection_is_engagement_visible(p_reflection_id)
  ORDER BY c.created_at ASC;
$$;

GRANT EXECUTE ON FUNCTION get_reflection_comments(UUID) TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_portal_peers'
  ) THEN
    CREATE POLICY "profiles_select_portal_peers" ON profiles
      FOR SELECT USING (
        get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
      );
  END IF;
END $$;
