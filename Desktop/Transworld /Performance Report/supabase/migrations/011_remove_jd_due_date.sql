-- Migration 011: Remove due_date from job_directions

-- 1. Drop view if exists and recreate without due_date column
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

-- 2. Drop due_date from base table
ALTER TABLE job_directions DROP COLUMN IF EXISTS due_date;
