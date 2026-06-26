-- ============================================================
-- Migration 033: get_jd_monthly_history RPC
-- Returns each JD's target vs achieved for a given month/year.
-- Access is scoped by caller role (same logic as the live view).
-- ============================================================

CREATE OR REPLACE FUNCTION get_jd_monthly_history(p_year INT, p_month INT)
RETURNS TABLE (
  id            TEXT,
  work_details  TEXT,
  monthly_target NUMERIC,
  monthly_achieved NUMERIC,
  employee_id   UUID,
  employee_name TEXT,
  status        TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID := auth.uid();
  v_caller_role TEXT;
  v_start       TIMESTAMPTZ;
  v_end         TIMESTAMPTZ;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;

  v_start := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_end   := v_start + INTERVAL '1 month';

  RETURN QUERY
  SELECT
    jd.id::TEXT,
    jd.work_details,
    jd.monthly_target,
    COALESCE(agg.total, 0)::NUMERIC AS monthly_achieved,
    jd.employee_id,
    p.full_name AS employee_name,
    jd.status
  FROM job_directions jd
  JOIN profiles p ON p.id = jd.employee_id
  LEFT JOIN (
    SELECT job_direction_id, SUM(amount_completed) AS total
    FROM job_direction_progress_logs
    WHERE created_at >= v_start AND created_at < v_end
    GROUP BY job_direction_id
  ) agg ON agg.job_direction_id = jd.id
  WHERE
    CASE
      WHEN v_caller_role IN ('managing_director', 'executive_assistant', 'hr', 'director')
        THEN TRUE
      WHEN v_caller_role = 'manager'
        THEN (jd.employee_id = v_caller_id OR jd.manager_id = v_caller_id)
      ELSE
        jd.employee_id = v_caller_id
    END
  ORDER BY p.full_name, jd.work_details;
END;
$$;

GRANT EXECUTE ON FUNCTION get_jd_monthly_history(INT, INT) TO authenticated;
