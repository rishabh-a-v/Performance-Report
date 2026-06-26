-- ============================================================
-- Migration 004: Measurable Tasks & Outcome-Based Tracking
-- ============================================================

-- ─── Measurement type enum ───────────────────────────────────
CREATE TYPE measurement_type AS ENUM (
  'count', 'currency', 'percentage', 'hours',
  'documents', 'invoices', 'audits', 'calls',
  'emails', 'leads', 'custom'
);

-- ─── Add measurement columns to tasks ────────────────────────
ALTER TABLE tasks
  ADD COLUMN measurement_type    measurement_type,
  ADD COLUMN target_quantity     NUMERIC(12,2),
  ADD COLUMN completed_quantity  NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN unit                VARCHAR(100);

-- Progress percentage column (updated by trigger for outcome-based tracking)
ALTER TABLE tasks
  ADD COLUMN progress_percentage NUMERIC(5,2) DEFAULT 0;

-- Validate completed never exceeds target
ALTER TABLE tasks
  ADD CONSTRAINT chk_completed_lte_target
  CHECK (completed_quantity IS NULL OR target_quantity IS NULL OR completed_quantity <= target_quantity);

-- Index for measurable task queries
CREATE INDEX idx_tasks_measurable ON tasks(measurement_type) WHERE measurement_type IS NOT NULL;
CREATE INDEX idx_tasks_dept_measurable ON tasks(department_id, measurement_type) WHERE measurement_type IS NOT NULL;

-- ─── Progress history ─────────────────────────────────────────
CREATE TABLE task_progress_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  recorded_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_quantity  NUMERIC(12,2) NOT NULL,
  progress_percentage NUMERIC(5,2) NOT NULL,
  daily_delta         NUMERIC(12,2) NOT NULL DEFAULT 0,   -- units added since last record
  recorded_by         UUID REFERENCES profiles(id),
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, recorded_date)
);

CREATE INDEX idx_progress_task_date ON task_progress_history(task_id, recorded_date DESC);

-- ─── RLS for progress history ─────────────────────────────────
ALTER TABLE task_progress_history ENABLE ROW LEVEL SECURITY;

-- Employees see own task history
CREATE POLICY "progress_history: self read"
  ON task_progress_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND assignee_id = auth.uid())
  );

-- Managers see team history
CREATE POLICY "progress_history: manager read"
  ON task_progress_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p ON p.id = t.assignee_id
      WHERE t.id = task_id AND p.manager_id = auth.uid()
    )
  );

-- Dept heads and executives see all
CREATE POLICY "progress_history: exec read all"
  ON task_progress_history FOR SELECT
  USING (auth_role() IN ('director', 'managing_director'));

-- Employees can insert progress for own tasks
CREATE POLICY "progress_history: self insert"
  ON task_progress_history FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND assignee_id = auth.uid())
  );

-- ─── Trigger: auto-record progress history on quantity change ──
CREATE OR REPLACE FUNCTION record_progress_history()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_delta NUMERIC;
  v_pct   NUMERIC;
BEGIN
  -- Only fire when completed_quantity actually changes
  IF NEW.completed_quantity IS DISTINCT FROM OLD.completed_quantity
     AND NEW.measurement_type IS NOT NULL
     AND NEW.target_quantity > 0
  THEN
    v_delta := COALESCE(NEW.completed_quantity, 0) - COALESCE(OLD.completed_quantity, 0);
    v_pct   := ROUND((NEW.completed_quantity / NEW.target_quantity) * 100, 2);

    INSERT INTO task_progress_history
      (task_id, recorded_date, completed_quantity, progress_percentage, daily_delta)
    VALUES
      (NEW.id, CURRENT_DATE, NEW.completed_quantity, v_pct, v_delta)
    ON CONFLICT (task_id, recorded_date) DO UPDATE SET
      completed_quantity  = EXCLUDED.completed_quantity,
      progress_percentage = EXCLUDED.progress_percentage,
      daily_delta         = task_progress_history.daily_delta + EXCLUDED.daily_delta;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_task_progress_history
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION record_progress_history();

-- ─── Throughput view ──────────────────────────────────────────
-- Computes per-task daily throughput over last 7 days
CREATE OR REPLACE VIEW task_throughput AS
SELECT
  t.id AS task_id,
  t.title,
  t.assignee_id,
  t.department_id,
  t.measurement_type,
  t.target_quantity,
  t.completed_quantity,
  t.unit,
  t.due_date,
  t.started_at,
  -- avg units per day since task start
  CASE
    WHEN t.started_at IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - t.started_at)) > 0
    THEN ROUND(
      COALESCE(t.completed_quantity, 0) /
      NULLIF(EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 86400, 0),
    2)
    ELSE 0
  END AS avg_daily_throughput,
  -- forecast days remaining
  CASE
    WHEN t.target_quantity > COALESCE(t.completed_quantity, 0)
      AND t.started_at IS NOT NULL
      AND EXTRACT(EPOCH FROM (NOW() - t.started_at)) > 86400
    THEN ROUND(
      (t.target_quantity - COALESCE(t.completed_quantity, 0)) /
      NULLIF(
        COALESCE(t.completed_quantity, 0) /
        NULLIF(EXTRACT(EPOCH FROM (NOW() - t.started_at)) / 86400, 0),
      0),
    1)
    ELSE NULL
  END AS forecast_days_remaining
FROM tasks t
WHERE t.measurement_type IS NOT NULL;
