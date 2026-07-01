-- ============================================================
-- Migration 038: Team Jobs
-- A parent "job" split into sub-tasks owned by different team
-- members, each tracking their own status and notes.
-- ============================================================

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_jobs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  created_by  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  head_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  status      TEXT        NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'completed', 'cancelled')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_job_tasks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       UUID        NOT NULL REFERENCES team_jobs(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  task_type    TEXT,
  assignee_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT        NOT NULL DEFAULT 'Yet to start'
               CHECK (status IN ('Yet to start', 'In progress', 'Completed')),
  notes        TEXT,
  completed_at TIMESTAMPTZ,
  due_date     DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at triggers ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_team_jobs_updated_at       ON team_jobs;
DROP TRIGGER IF EXISTS trg_team_job_tasks_updated_at  ON team_job_tasks;

CREATE TRIGGER trg_team_jobs_updated_at
  BEFORE UPDATE ON team_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_team_job_tasks_updated_at
  BEFORE UPDATE ON team_job_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Helper: is caller a member of a team job ─────────────────────────────────

CREATE OR REPLACE FUNCTION is_team_job_member(p_job_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_uid UUID := auth.uid();
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_jobs      WHERE id = p_job_id AND (created_by = v_uid OR head_id = v_uid)
    UNION ALL
    SELECT 1 FROM team_job_tasks WHERE job_id = p_job_id AND assignee_id = v_uid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION is_team_job_member(UUID) TO authenticated;

-- ── Helper: is caller a manager or above ─────────────────────────────────────

CREATE OR REPLACE FUNCTION is_manager_or_above()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN v_role IN ('manager','director','managing_director','executive_assistant','hr');
END;
$$;

GRANT EXECUTE ON FUNCTION is_manager_or_above() TO authenticated;

-- ── RLS: team_jobs ───────────────────────────────────────────────────────────

ALTER TABLE team_jobs ENABLE ROW LEVEL SECURITY;

-- All members can read their jobs; MD/EA/HR/Director see all
CREATE POLICY "team_jobs_select"
  ON team_jobs FOR SELECT TO authenticated
  USING (
    is_team_job_member(id) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr','director')
  );

-- Only managers+ can create
CREATE POLICY "team_jobs_insert"
  ON team_jobs FOR INSERT TO authenticated
  WITH CHECK (is_manager_or_above() AND created_by = auth.uid());

-- Creator, head, or admin can update
CREATE POLICY "team_jobs_update"
  ON team_jobs FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    head_id    = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr')
  );

-- Creator or admin can delete
CREATE POLICY "team_jobs_delete"
  ON team_jobs FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr')
  );

-- ── RLS: team_job_tasks ──────────────────────────────────────────────────────

ALTER TABLE team_job_tasks ENABLE ROW LEVEL SECURITY;

-- Members of the parent job can read sub-tasks
CREATE POLICY "team_job_tasks_select"
  ON team_job_tasks FOR SELECT TO authenticated
  USING (
    is_team_job_member(job_id) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr','director')
  );

-- Creator or head of parent job can add sub-tasks
CREATE POLICY "team_job_tasks_insert"
  ON team_job_tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_jobs
      WHERE id = job_id AND (created_by = auth.uid() OR head_id = auth.uid())
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr')
  );

-- Assignee can update their own sub-task; creator/head/admin can update any
CREATE POLICY "team_job_tasks_update"
  ON team_job_tasks FOR UPDATE TO authenticated
  USING (
    assignee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_jobs
      WHERE id = job_id AND (created_by = auth.uid() OR head_id = auth.uid())
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr')
  );

-- Creator, head, or admin can delete sub-tasks
CREATE POLICY "team_job_tasks_delete"
  ON team_job_tasks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_jobs
      WHERE id = job_id AND (created_by = auth.uid() OR head_id = auth.uid())
    ) OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('managing_director','executive_assistant','hr')
  );
