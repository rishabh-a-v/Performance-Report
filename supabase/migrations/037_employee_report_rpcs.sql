-- ============================================================
-- Migration 037: Employee Report RPCs
-- Two functions that return JD and Task data for a given
-- employee over an arbitrary date range.
-- Access is scoped by caller role (same pattern as 033).
-- ============================================================

-- Helper: check if caller is allowed to view a given employee's data
CREATE OR REPLACE FUNCTION can_view_employee(p_target_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id   UUID := auth.uid();
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = v_caller_id;

  RETURN CASE
    WHEN v_caller_role IN ('managing_director', 'executive_assistant', 'hr', 'director')
      THEN TRUE
    WHEN v_caller_role = 'manager'
      THEN (p_target_id = v_caller_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = p_target_id AND manager_id = v_caller_id
      ))
    ELSE
      p_target_id = v_caller_id
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION can_view_employee(UUID) TO authenticated;

-- ── JD Report ────────────────────────────────────────────────────────────────
-- Returns each Job Direction for the employee with progress logged in [p_start, p_end).

CREATE OR REPLACE FUNCTION get_employee_jd_report(
  p_employee_id UUID,
  p_start       TIMESTAMPTZ,
  p_end         TIMESTAMPTZ
)
RETURNS TABLE (
  id                  TEXT,
  work_details        TEXT,
  monthly_target      NUMERIC,
  achieved_in_period  NUMERIC,
  status              TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT can_view_employee(p_employee_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    jd.id::TEXT,
    jd.work_details,
    jd.monthly_target::NUMERIC,
    COALESCE(agg.total, 0)::NUMERIC AS achieved_in_period,
    jd.status
  FROM job_directions jd
  LEFT JOIN (
    SELECT job_direction_id, SUM(amount_completed) AS total
    FROM job_direction_progress_logs
    WHERE employee_id = p_employee_id
      AND created_at >= p_start
      AND created_at <  p_end
    GROUP BY job_direction_id
  ) agg ON agg.job_direction_id = jd.id
  WHERE jd.employee_id = p_employee_id
  ORDER BY jd.work_details;
END;
$$;

GRANT EXECUTE ON FUNCTION get_employee_jd_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ── Task Report ──────────────────────────────────────────────────────────────
-- Returns special tasks assigned to the employee.

CREATE OR REPLACE FUNCTION get_employee_task_report(
  p_employee_id UUID,
  p_start       TIMESTAMPTZ,
  p_end         TIMESTAMPTZ
)
RETURNS TABLE (
  id         TEXT,
  task_name  TEXT,
  due_date   DATE,
  status     TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT can_view_employee(p_employee_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    st.id::TEXT,
    st.task_name,
    st.due_date,
    st.status,
    st.created_at
  FROM special_tasks st
  JOIN task_assignees ta ON ta.task_id = st.id AND ta.employee_id = p_employee_id
  WHERE st.created_at >= p_start OR st.due_date >= p_start::DATE
  ORDER BY st.due_date DESC NULLS LAST, st.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_employee_task_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
