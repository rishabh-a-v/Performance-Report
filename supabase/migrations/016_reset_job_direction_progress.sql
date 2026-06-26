-- 016_reset_job_direction_progress.sql
-- Migration to add optional reset logs table for job direction progress counters

-- Create a table to log each reset execution (optional but useful for audit)
CREATE TABLE IF NOT EXISTS job_direction_progress_reset_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reset_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly')) NOT NULL,
  reset_by TEXT DEFAULT 'system' -- could store function name or user if manual
);

-- Grant RLS policies (if needed) – allow only service_role to insert
ALTER TABLE job_direction_progress_reset_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_service_role" ON job_direction_progress_reset_logs
  FOR INSERT TO service_role USING (true);

-- No changes to existing job_directions table needed as counters already exist.

-- End of migration
