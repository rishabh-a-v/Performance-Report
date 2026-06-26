-- Migration 010: Job Direction Multi Targets and Progress Logging

-- 1. Drop deprecated columns
ALTER TABLE job_directions 
  DROP COLUMN IF EXISTS frequency,
  DROP COLUMN IF EXISTS target_amount,
  DROP COLUMN IF EXISTS completed_amount;

-- 2. Add multi-tiered target columns
ALTER TABLE job_directions
  ADD COLUMN daily_target NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN weekly_target NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN monthly_target NUMERIC(15,2) DEFAULT 0;

-- 3. Create incremental progress logging table
CREATE TABLE job_direction_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_direction_id TEXT NOT NULL REFERENCES job_directions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_completed NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE job_direction_progress_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies
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

-- 6. Create a security-invoking view to aggregate progress logs dynamically
DROP VIEW IF EXISTS job_directions_with_progress;

CREATE VIEW job_directions_with_progress 
WITH (security_invoker = true) AS
SELECT 
  jd.id,
  jd.title,
  jd.work_details,
  jd.employee_id,
  jd.manager_id,
  jd.department_id,
  jd.progress_type,
  jd.unit,
  COALESCE(daily.amount, 0) AS daily_completed,
  COALESCE(weekly.amount, 0) AS weekly_completed,
  COALESCE(monthly.amount, 0) AS monthly_completed,
  jd.daily_target,
  jd.weekly_target,
  jd.monthly_target,
  CASE 
    WHEN jd.progress_type = 'milestone' THEN jd.progress_percentage
    WHEN jd.monthly_target > 0 THEN LEAST(100.0, ROUND((COALESCE(monthly.amount, 0) / jd.monthly_target) * 100.0, 1))
    WHEN jd.weekly_target > 0 THEN LEAST(100.0, ROUND((COALESCE(weekly.amount, 0) / jd.weekly_target) * 100.0, 1))
    WHEN jd.daily_target > 0 THEN LEAST(100.0, ROUND((COALESCE(daily.amount, 0) / jd.daily_target) * 100.0, 1))
    ELSE 0.0
  END AS progress_percentage,
  jd.status,
  jd.review_notes,
  jd.due_date,
  jd.submitted_for_review_at,
  jd.approved_at,
  jd.rejected_at,
  jd.pending_edits,
  jd.created_at,
  jd.updated_at,
  jd.remarks,
  jd.requires_supervisor_verification,
  jd.verifier_id,
  jd.verified_at,
  jd.verification_notes
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
