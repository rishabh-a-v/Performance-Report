-- 1. Drop old single target columns
ALTER TABLE job_directions 
  DROP COLUMN IF EXISTS frequency,
  DROP COLUMN IF EXISTS target_amount,
  DROP COLUMN IF EXISTS completed;

-- 2. Add multi-tiered targets
ALTER TABLE job_directions
  ADD COLUMN daily_target numeric DEFAULT 0,
  ADD COLUMN weekly_target numeric DEFAULT 0,
  ADD COLUMN monthly_target numeric DEFAULT 0;

-- 3. Create progress logs table
CREATE TABLE IF NOT EXISTS job_direction_progress_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_direction_id text NOT NULL REFERENCES job_directions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_completed numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Enable RLS and add policies
ALTER TABLE job_direction_progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can insert their own logs" ON job_direction_progress_logs
  FOR INSERT WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Employees can read their own logs" ON job_direction_progress_logs
  FOR SELECT USING (auth.uid() = employee_id);

CREATE POLICY "Managers can read team logs" ON job_direction_progress_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = job_direction_progress_logs.employee_id
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "Directors/MDs can read all logs" ON job_direction_progress_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('director', 'managing_director', 'executive_assistant')
    )
  );

-- 5. Create dynamic aggregation view
DROP VIEW IF EXISTS job_directions_with_progress;
CREATE OR REPLACE VIEW job_directions_with_progress AS
SELECT 
  jd.id,
  jd.work_details,
  jd.employee_id,
  jd.manager_id,
  jd.department_id,
  jd.status,
  jd.remarks,
  jd.daily_target,
  jd.weekly_target,
  jd.monthly_target,
  COALESCE(daily.amount, 0) AS daily_completed,
  COALESCE(weekly.amount, 0) AS weekly_completed,
  COALESCE(monthly.amount, 0) AS monthly_completed
FROM job_directions jd
LEFT JOIN (
  SELECT job_direction_id, SUM(amount_completed) AS amount
  FROM job_direction_progress_logs
  WHERE created_at::date = CURRENT_DATE
  GROUP BY job_direction_id
) daily ON daily.job_direction_id = jd.id
LEFT JOIN (
  SELECT job_direction_id, SUM(amount_completed) AS amount
  FROM job_direction_progress_logs
  WHERE created_at >= date_trunc('week', CURRENT_DATE)
  GROUP BY job_direction_id
) weekly ON weekly.job_direction_id = jd.id
LEFT JOIN (
  SELECT job_direction_id, SUM(amount_completed) AS amount
  FROM job_direction_progress_logs
  WHERE created_at >= date_trunc('month', CURRENT_DATE)
  GROUP BY job_direction_id
) monthly ON monthly.job_direction_id = jd.id;
