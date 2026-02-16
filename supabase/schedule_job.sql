
-- 1. Enable Required Extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule the Reminder Job
-- This will run every Monday at 08:00 AM
-- Replace <PROJECT_REF> with your Supabase project reference
-- Replace <ANON_KEY> with your Supabase anon key (or service_role key for internal calls)
select
  cron.schedule(
    'scheduled-reminder-job',
    '0 8 * * 1', -- 08:00 every Monday
    $$
    select
      net.http_post(
        url:='https://<PROJECT_REF>.supabase.co/functions/v1/scheduled-reminder',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
        body:='{}'::jsonb
      )
    $$
  );

-- To check if the job is scheduled:
-- select * from cron.job;

-- To check job execution logs:
-- select * from cron.job_run_details order by start_time desc;
