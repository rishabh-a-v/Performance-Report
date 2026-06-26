-- Add description column to job directions
ALTER TABLE job_directions ADD COLUMN IF NOT EXISTS description text;

-- Recreate the view to include the new column
DROP VIEW IF EXISTS job_directions_with_progress;

CREATE VIEW job_directions_with_progress AS
SELECT
  jd.id,
  jd.work_details,
  jd.description,
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
  WHERE created_at >= date_trunc('week', CURRENT_DATE::timestamptz)
  GROUP BY job_direction_id
) weekly ON weekly.job_direction_id = jd.id
LEFT JOIN (
  SELECT job_direction_id, SUM(amount_completed) AS amount
  FROM job_direction_progress_logs
  WHERE created_at >= date_trunc('month', CURRENT_DATE::timestamptz)
  GROUP BY job_direction_id
) monthly ON monthly.job_direction_id = jd.id;
