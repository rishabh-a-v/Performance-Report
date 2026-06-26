-- ============================================================
-- Migration 031: delete_employee RPC
-- Deletes an auth user (cascades to profiles + reporting).
-- Only MD, Director, EA may call this; self-deletion blocked.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_employee(p_employee_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('managing_director', 'director', 'executive_assistant')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to delete employees.';
  END IF;

  IF p_employee_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account.';
  END IF;

  DELETE FROM auth.users WHERE id = p_employee_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_employee(UUID)
  TO authenticated;
