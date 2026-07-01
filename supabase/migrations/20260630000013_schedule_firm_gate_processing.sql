-- Supabase owns the delayed gate unlock schedule so Vercel Hobby limits do not apply.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'process-firm-gates',
  '*/5 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://semperr.com/api/internal/firms/process-gates',
      body := '{}'::jsonb,
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type',
        'application/json',
        'x-vercel-cron',
        '1'
      ),
      timeout_milliseconds := 10000
    );
  $$
);
