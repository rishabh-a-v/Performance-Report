-- ============================================================
-- Migration 003: Automation Triggers
-- ============================================================

-- ─── updated_at auto-maintenance ─────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_checkins_updated_at
  BEFORE UPDATE ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_audits_updated_at
  BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─── Auto-set task started_at when status → in_progress ──────
CREATE OR REPLACE FUNCTION task_lifecycle()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' AND NEW.started_at IS NULL THEN
    NEW.started_at = NOW();
  END IF;

  IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = NOW();
  END IF;

  -- Unblock task when status changes away from blocked
  IF OLD.status = 'blocked' AND NEW.status != 'blocked' THEN
    UPDATE blockers
    SET resolved_at = NOW()
    WHERE task_id = NEW.id AND resolved_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_lifecycle
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION task_lifecycle();

-- ─── Create blocker record when checkin reports blocked ───────
CREATE OR REPLACE FUNCTION checkin_blocker_sync()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_blocked = TRUE AND NEW.blocker_description IS NOT NULL THEN
    INSERT INTO blockers (employee_id, description, reported_at)
    VALUES (NEW.user_id, NEW.blocker_description, NOW())
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkin_blocker
  AFTER INSERT ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION checkin_blocker_sync();

-- ─── Notify manager when a report is blocked ─────────────────
CREATE OR REPLACE FUNCTION notify_manager_on_block()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  mgr_id UUID;
  emp_name TEXT;
BEGIN
  SELECT manager_id, full_name INTO mgr_id, emp_name
  FROM profiles WHERE id = NEW.employee_id;

  IF mgr_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, body, type)
    VALUES (
      mgr_id,
      emp_name || ' is blocked',
      NEW.description,
      'warning'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_manager_block
  AFTER INSERT ON blockers
  FOR EACH ROW EXECUTE FUNCTION notify_manager_on_block();

-- ─── Weekly performance snapshot function ────────────────────
CREATE OR REPLACE FUNCTION compute_performance_snapshot(p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_assigned  INTEGER;
  v_completed INTEGER;
  v_blocked   INTEGER;
  v_avg_cycle NUMERIC;
  v_rate      NUMERIC;
  v_kpi       NUMERIC;
BEGIN
  SELECT
    COUNT(*)                                                                     AS assigned,
    COUNT(*) FILTER (WHERE status = 'done')                                      AS completed,
    COUNT(*) FILTER (WHERE status = 'blocked')                                   AS blocked,
    AVG(cycle_time_hours) FILTER (WHERE cycle_time_hours IS NOT NULL)            AS avg_cycle
  INTO v_assigned, v_completed, v_blocked, v_avg_cycle
  FROM tasks
  WHERE assignee_id = p_user_id;

  v_rate := CASE WHEN v_assigned > 0 THEN ROUND((v_completed::NUMERIC / v_assigned) * 100, 2) ELSE 0 END;

  -- KPI formula: rate - blocker penalty + cycle bonus
  v_kpi := GREATEST(0, LEAST(100,
    v_rate
    - LEAST(COALESCE((
        SELECT SUM(hours_blocked) FROM blockers WHERE employee_id = p_user_id AND resolved_at IS NULL
      ), 0) / 8, 20)
    + CASE WHEN COALESCE(v_avg_cycle, 999) < 24 THEN 5 ELSE 0 END
  ));

  INSERT INTO performance_snapshots
    (user_id, snapshot_date, tasks_assigned, tasks_completed, tasks_blocked, avg_cycle_time_hours, completion_rate, kpi_score)
  VALUES
    (p_user_id, CURRENT_DATE, v_assigned, v_completed, v_blocked, v_avg_cycle, v_rate, v_kpi)
  ON CONFLICT (user_id, snapshot_date) DO UPDATE SET
    tasks_assigned       = EXCLUDED.tasks_assigned,
    tasks_completed      = EXCLUDED.tasks_completed,
    tasks_blocked        = EXCLUDED.tasks_blocked,
    avg_cycle_time_hours = EXCLUDED.avg_cycle_time_hours,
    completion_rate      = EXCLUDED.completion_rate,
    kpi_score            = EXCLUDED.kpi_score;
END;
$$;

-- ─── Department snapshot function ────────────────────────────
CREATE OR REPLACE FUNCTION compute_department_snapshot(p_dept_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_active    INTEGER;
  v_completed INTEGER;
  v_blocked   INTEGER;
  v_avg_cycle NUMERIC;
  v_util      NUMERIC;
  v_eff       NUMERIC;
  v_kpi       NUMERIC;
  v_members   INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status IN ('in_progress','ready'))  AS active,
    COUNT(*) FILTER (WHERE status = 'done')                    AS completed,
    COUNT(*) FILTER (WHERE status = 'blocked')                 AS blocked,
    AVG(cycle_time_hours) FILTER (WHERE cycle_time_hours IS NOT NULL) AS avg_cycle
  INTO v_active, v_completed, v_blocked, v_avg_cycle
  FROM tasks
  WHERE department_id = p_dept_id;

  SELECT COUNT(*) INTO v_members FROM profiles WHERE department_id = p_dept_id AND is_active;

  v_util := CASE WHEN v_members > 0
    THEN LEAST(100, ROUND((v_active::NUMERIC / GREATEST(v_members, 1)) * 100, 2))
    ELSE 0 END;

  v_eff := CASE WHEN (v_active + v_completed) > 0
    THEN ROUND((v_completed::NUMERIC / (v_active + v_completed)) * 100, 2)
    ELSE 0 END;

  v_kpi := GREATEST(0, LEAST(100,
    v_eff
    - LEAST(v_blocked * 5, 20)
    + CASE WHEN COALESCE(v_avg_cycle, 999) < 30 THEN 3 ELSE 0 END
  ));

  INSERT INTO department_snapshots
    (department_id, snapshot_date, active_tasks, completed_tasks, blocked_tasks, avg_cycle_time_hours, utilization_pct, efficiency_score, kpi_score)
  VALUES
    (p_dept_id, CURRENT_DATE, v_active, v_completed, v_blocked, v_avg_cycle, v_util, v_eff, v_kpi)
  ON CONFLICT (department_id, snapshot_date) DO UPDATE SET
    active_tasks         = EXCLUDED.active_tasks,
    completed_tasks      = EXCLUDED.completed_tasks,
    blocked_tasks        = EXCLUDED.blocked_tasks,
    avg_cycle_time_hours = EXCLUDED.avg_cycle_time_hours,
    utilization_pct      = EXCLUDED.utilization_pct,
    efficiency_score     = EXCLUDED.efficiency_score,
    kpi_score            = EXCLUDED.kpi_score;
END;
$$;

-- ─── New user → create profile ───────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
