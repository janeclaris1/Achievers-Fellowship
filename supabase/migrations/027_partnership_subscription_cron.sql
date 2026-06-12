-- Schedule daily partnership subscription charges at 6:00 AM UTC
-- Run after enabling pg_cron and pg_net in Supabase Dashboard
-- Replace <project-ref> and <service_role_key> with your project values

/*
SELECT cron.schedule(
  'partnership-subscription-daily-charge',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/charge-partnership-subscriptions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <service_role_key>'
      )
    );
  $$
);
*/

-- To unschedule:
-- SELECT cron.unschedule('partnership-subscription-daily-charge');
