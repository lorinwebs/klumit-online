-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Daily family schedule cron job at 7:00 AM Israel time (4:00 AM UTC)
-- Calls the Next.js API endpoint which sends Telegram message
select cron.schedule(
  'family-daily-schedule',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://klumit-online.co.il/api/family/daily-schedule',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- To verify the cron job was created:
-- select * from cron.job;

-- To remove the cron job if needed:
-- select cron.unschedule('family-daily-schedule');
