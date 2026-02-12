-- Enable pg_cron and pg_net if not already enabled
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule reminder checks every 5 minutes
-- Runs at: XX:00, XX:05, XX:10, XX:15, XX:20, XX:25, XX:30, XX:35, XX:40, XX:45, XX:50, XX:55
select cron.schedule(
  'family-schedule-reminders', -- job name
  '*/5 * * * *',                -- every 5 minutes
  $$
  select
    net.http_post(
      url := 'https://klumit-online.vercel.app/api/family/check-reminders',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) as request_id;
  $$
);

-- Query to check the job status:
-- SELECT * FROM cron.job WHERE jobname = 'family-schedule-reminders';

-- Query to see job run history:
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'family-schedule-reminders') ORDER BY start_time DESC LIMIT 10;

-- To unschedule (if needed):
-- SELECT cron.unschedule('family-schedule-reminders');
