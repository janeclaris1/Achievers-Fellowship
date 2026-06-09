-- Show commenter names on reflection comments

ALTER TABLE reflection_comments
  ADD COLUMN IF NOT EXISTS author_name TEXT;

-- Backfill existing comments
UPDATE reflection_comments c
SET author_name = p.full_name
FROM profiles p
WHERE c.profile_id = p.id
  AND (c.author_name IS NULL OR c.author_name = '');

-- Portal users can read peer profiles (comment authors, reflection authors, etc.)
CREATE POLICY "profiles_select_portal_peers" ON profiles
  FOR SELECT USING (
    get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
  );
