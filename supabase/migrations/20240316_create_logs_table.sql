-- Create logs table for application logging
CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  request_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add row level security for the logs table
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Only admin users should be able to select logs
CREATE POLICY "Allow admins to select logs" ON public.logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  ));

-- Only authenticated users can insert logs
CREATE POLICY "Allow authenticated users to insert logs" ON public.logs
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create index on common search fields
CREATE INDEX logs_timestamp_idx ON public.logs (timestamp);
CREATE INDEX logs_level_idx ON public.logs (level);
CREATE INDEX logs_source_idx ON public.logs (source);
CREATE INDEX logs_user_id_idx ON public.logs (user_id);
CREATE INDEX logs_request_id_idx ON public.logs (request_id);

-- Add function to clean up old logs
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 30 days
  DELETE FROM public.logs
  WHERE timestamp < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add cron job to clean up logs (requires pg_cron extension)
-- This requires the pg_cron extension to be enabled
-- COMMENT OUT the following line if pg_cron is not available
-- SELECT cron.schedule('0 0 * * *', 'SELECT clean_old_logs();'); 