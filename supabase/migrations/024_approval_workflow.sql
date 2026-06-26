-- ============================================================
-- Migration 024: Enforce Approval for Tasks and Job Directions
-- ============================================================

-- 1. Sync reporting.reporting_to_id to profiles.manager_id
CREATE OR REPLACE FUNCTION public.sync_reporting_to_profiles_manager()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles
    SET manager_id = NEW.reporting_to_id
    WHERE id = NEW.employee_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET manager_id = NULL
    WHERE id = OLD.employee_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_sync_reporting_to_profiles_manager
AFTER INSERT OR UPDATE OR DELETE ON public.reporting
FOR EACH ROW
EXECUTE FUNCTION public.sync_reporting_to_profiles_manager();

-- One-time sync of profiles.manager_id from reporting table
UPDATE public.profiles p
SET manager_id = r.reporting_to_id
FROM public.reporting r
WHERE p.id = r.employee_id;


-- 2. Add Special Task Approval columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'special_task_approval_status') THEN
    CREATE TYPE special_task_approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END
$$;

ALTER TABLE public.special_tasks
  ADD COLUMN IF NOT EXISTS approval_status special_task_approval_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approval_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approval_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_note TEXT;


-- 3. Trigger to enforce special task updates by employees/assignees
CREATE OR REPLACE FUNCTION public.enforce_special_task_updates()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get the updater's role
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();

  -- If modified by the employee themselves, and they change task details, force approval_status to 'pending'
  -- (If they are the assigned_by manager or Director/MD/EA, they can save directly without changing approval_status)
  IF NOT (
    OLD.assigned_by = auth.uid() OR
    v_role IN ('managing_director', 'executive_assistant')
  ) THEN
    -- updater is the employee
    IF NEW.task_name <> OLD.task_name OR
       (NEW.due_date IS DISTINCT FROM OLD.due_date) OR
       (NEW.remarks IS DISTINCT FROM OLD.remarks) THEN
      NEW.approval_status := 'pending';
    END IF;

    -- Block assignees from directly approving/rejecting tasks
    IF NEW.approval_status <> OLD.approval_status AND NEW.approval_status IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'Only managers, MD, or EA can approve or reject tasks';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_enforce_special_task_updates
BEFORE UPDATE ON public.special_tasks
FOR EACH ROW
EXECUTE FUNCTION public.enforce_special_task_updates();


-- 4. Trigger to enforce job direction updates by employees
CREATE OR REPLACE FUNCTION public.enforce_job_direction_updates()
RETURNS TRIGGER AS $$
DECLARE
  v_role text;
BEGIN
  -- Get the updater's role
  SELECT role::text INTO v_role FROM public.profiles WHERE id = auth.uid();

  -- If updated by the employee themselves, and they change details, force status to 'submitted'
  IF NOT (
    OLD.manager_id = auth.uid() OR
    v_role IN ('managing_director', 'executive_assistant')
  ) THEN
    IF NEW.work_details IS DISTINCT FROM OLD.work_details OR
       NEW.daily_target IS DISTINCT FROM OLD.daily_target OR
       NEW.weekly_target IS DISTINCT FROM OLD.weekly_target OR
       NEW.monthly_target IS DISTINCT FROM OLD.monthly_target OR
       NEW.remarks IS DISTINCT FROM OLD.remarks THEN
      NEW.status := 'submitted';
    END IF;

    -- Block employees from directly approving/rejecting job directions
    IF NEW.status <> OLD.status AND NEW.status IN ('approved', 'rejected') THEN
      RAISE EXCEPTION 'Only managers, MD, or EA can approve or reject job directions';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_enforce_job_direction_updates
BEFORE UPDATE ON public.job_directions
FOR EACH ROW
EXECUTE FUNCTION public.enforce_job_direction_updates();
