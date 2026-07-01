-- RPC: get_employee_team_task_report
-- Returns team job sub-tasks assigned to an employee that were created within the given date range.
-- Reuses can_view_employee() from migration 037 for RBAC enforcement.

CREATE OR REPLACE FUNCTION get_employee_team_task_report(
  p_employee_id UUID,
  p_start       TIMESTAMPTZ,
  p_end         TIMESTAMPTZ
)
RETURNS TABLE (
  id             UUID,
  sub_task_title TEXT,
  job_title      TEXT,
  task_type      TEXT,
  due_date       DATE,
  status         TEXT,
  completed_at   TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT can_view_employee(p_employee_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    t.id,
    t.title       AS sub_task_title,
    j.title       AS job_title,
    t.task_type,
    t.due_date,
    t.status::TEXT,
    t.completed_at,
    t.notes,
    t.created_at
  FROM  team_job_tasks t
  JOIN  team_jobs       j ON j.id = t.job_id
  WHERE t.assignee_id = p_employee_id
    AND t.created_at BETWEEN p_start AND p_end
  ORDER BY t.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_employee_team_task_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO authenticated;
