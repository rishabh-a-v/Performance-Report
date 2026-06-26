-- 005_progress_models.sql  –  Three-model outcome tracking

CREATE TYPE progress_model AS ENUM ('quantity', 'value', 'milestone');
CREATE TYPE currency_code  AS ENUM ('INR', 'USD', 'EUR', 'GBP', 'AED');

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS progress_model    progress_model,
  ADD COLUMN IF NOT EXISTS target_value      NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS current_value     NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS currency          currency_code;

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  weight       NUMERIC(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_task ON milestones(task_id);

-- Trigger: auto-update task progress_percentage when a milestone changes
CREATE OR REPLACE FUNCTION sync_milestone_progress()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE tasks
  SET
    progress_percentage = (
      SELECT COALESCE(SUM(weight), 0)
      FROM   milestones
      WHERE  task_id = COALESCE(NEW.task_id, OLD.task_id)
        AND  completed = true
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_milestone_progress ON milestones;
CREATE TRIGGER trg_milestone_progress
  AFTER INSERT OR UPDATE OR DELETE ON milestones
  FOR EACH ROW EXECUTE FUNCTION sync_milestone_progress();

-- Trigger: quantity/value model progress_percentage
CREATE OR REPLACE FUNCTION sync_task_progress()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.progress_model = 'quantity' AND NEW.target_quantity IS NOT NULL AND NEW.target_quantity > 0 THEN
    NEW.progress_percentage := ROUND((COALESCE(NEW.completed_quantity, 0) / NEW.target_quantity) * 100, 2);
  ELSIF NEW.progress_model = 'value' AND NEW.target_value IS NOT NULL AND NEW.target_value > 0 THEN
    NEW.progress_percentage := ROUND((COALESCE(NEW.current_value, 0) / NEW.target_value) * 100, 2);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_task_progress ON tasks;
CREATE TRIGGER trg_task_progress
  BEFORE INSERT OR UPDATE OF completed_quantity, target_quantity, current_value, target_value, progress_model ON tasks
  FOR EACH ROW EXECUTE FUNCTION sync_task_progress();

-- RLS
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees_own_milestones" ON milestones
  FOR ALL USING (
    task_id IN (SELECT id FROM tasks WHERE assignee_id = auth.uid())
  );

CREATE POLICY "managers_team_milestones" ON milestones
  FOR SELECT USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN profiles p ON p.id = t.assignee_id
      WHERE p.manager_id = auth.uid()
    )
  );

CREATE POLICY "execs_all_milestones" ON milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('director','managing_director'))
  );
