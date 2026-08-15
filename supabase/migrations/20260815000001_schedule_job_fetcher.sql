-- Enable pg_net if not already enabled (required for pg_cron to make http requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the job fetcher to run daily at midnight
-- We use net.http_post to call the edge function
SELECT cron.schedule(
  'daily-job-fetch',
  '0 0 * * *', -- Every day at midnight
  $$
    SELECT net.http_post(
      url:='https://ubktoscausselrtpuxux.supabase.co/functions/v1/fetch-real-jobs',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:=jsonb_build_object('source', 'cron')
    );
  $$
);
