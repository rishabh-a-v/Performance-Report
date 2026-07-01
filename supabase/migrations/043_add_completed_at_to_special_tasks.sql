-- Add completed_at column (nullable; existing rows stay NULL)
ALTER TABLE special_tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Drop first so we can change the return type
DROP FUNCTION IF EXISTS get_employee_task_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

-- Recreate RPC to include completed_at
CREATE OR REPLACE FUNCTION get_employee_task_report(
  p_employee_id UUID,
  p_start       TIMESTAMPTZ,
  p_end         TIMESTAMPTZ
)
RETURNS TABLE (
  id           TEXT,
  task_name    TEXT,
  due_date     DATE,
  status       TEXT,
  created_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
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
    st.created_at,
    st.completed_at
  FROM special_tasks st
  JOIN task_assignees ta ON ta.task_id = st.id AND ta.employee_id = p_employee_id
  WHERE st.created_at >= p_start OR st.due_date >= p_start::DATE
  ORDER BY st.due_date DESC NULLS LAST, st.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_employee_task_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
