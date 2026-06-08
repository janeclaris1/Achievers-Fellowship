-- =============================================
-- ARCHEIVERS FELLOWSHIP — PG_CRON SETUP
-- Migration 004: Birthday Cron Job
-- =============================================

-- Enable pg_cron (requires Supabase Pro or enabling in dashboard)
-- Run this in the Supabase SQL editor after enabling pg_cron extension

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule birthday check every day at 7:00 AM UTC
-- Replace <project-ref> and <service_role_key> with your actual values

/*
SELECT cron.schedule(
  'birthday-daily-check',
  '0 7 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/birthday-cron',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <service_role_key>'
      )
    );
  $$
);
*/

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('birthday-daily-check');

-- Storage Buckets (run in Supabase Dashboard → Storage):
-- 1. Create bucket: member-photos (public)
-- 2. Create bucket: welfare-docs (private)  
-- 3. Create bucket: exports (private)

-- Storage policies for member-photos:
/*
CREATE POLICY "member_photos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

CREATE POLICY "member_photos_auth_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'member-photos' AND auth.role() = 'authenticated');

CREATE POLICY "member_photos_auth_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'member-photos' AND auth.role() = 'authenticated');
*/
