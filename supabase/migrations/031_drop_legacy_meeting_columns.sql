-- OPTIONAL cleanup — only if you applied the original 029 with Zoom/Meet columns.
-- Supabase will warn about destructive operations. Safe when you no longer need join_url/provider.
-- Skip this file if 029 was applied from the updated in-app meetings version.

ALTER TABLE church_meetings DROP CONSTRAINT IF EXISTS church_meetings_join_url_check;
ALTER TABLE church_meetings DROP COLUMN IF EXISTS join_url;
ALTER TABLE church_meetings DROP COLUMN IF EXISTS provider;

DROP TYPE IF EXISTS meeting_provider;
