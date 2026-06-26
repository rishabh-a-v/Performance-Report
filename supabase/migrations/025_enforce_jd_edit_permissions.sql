-- ====================================================================
-- Migration 025: Enforce Job Directions Edit Permissions
-- ====================================================================

CREATE OR REPLACE FUNCTION public.enforce_job_direction_updates()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get the updater's role
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();

  -- Who is allowed to edit?
  -- Only EA, MD, HR, and the manager (OLD.manager_id) can edit job direction details.
  IF NOT (
    OLD.manager_id = auth.uid() OR
    v_role IN ('managing_director', 'executive_assistant', 'hr')
  ) THEN
    -- They are not allowed to change details (work_details, targets, remarks)
    IF NEW.work_details IS DISTINCT FROM OLD.work_details OR
       NEW.daily_target IS DISTINCT FROM OLD.daily_target OR
       NEW.weekly_target IS DISTINCT FROM OLD.weekly_target OR
       NEW.monthly_target IS DISTINCT FROM OLD.monthly_target OR
       NEW.remarks IS DISTINCT FROM OLD.remarks THEN
      RAISE EXCEPTION 'Only EA, MD, HR, and their manager are allowed to edit Job Directions details.';
    END IF;
  END IF;

  -- Block non-managers/non-MD/non-EA from directly approving/rejecting/marking active
  IF NOT (
    OLD.manager_id = auth.uid() OR
    v_role IN ('managing_director', 'executive_assistant')
  ) THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('approved', 'rejected', 'active') THEN
      RAISE EXCEPTION 'Only managers, MD, or EA can approve or reject job directions';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
