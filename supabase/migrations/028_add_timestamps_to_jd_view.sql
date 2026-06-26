-- Migration 028: Add created_at and updated_at to job_directions_with_progress view
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
  jd.created_at,
  jd.updated_at,
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
