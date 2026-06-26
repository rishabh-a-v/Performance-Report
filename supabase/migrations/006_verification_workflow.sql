-- ============================================================
-- Migration 006: Chain-of-Command Verification Workflow
-- ============================================================
-- 1. Add executive_assistant to the user_role enum
-- 2. Add pending_verification to job_direction_status enum
-- 3. Add verification columns to job_directions
-- 4. Add pending_verification to special_task_status enum
-- 5. Add verification columns to special_tasks
-- ============================================================

-- 1. New role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'executive_assistant';

-- 2. New JD status (inject before 'draft' — Postgres appends, ordering is visual only)
ALTER TYPE job_direction_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- 3. Verification columns on job_directions
ALTER TABLE job_directions
  ADD COLUMN IF NOT EXISTS requires_supervisor_verification BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verifier_id                      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at                      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes               TEXT;

CREATE INDEX IF NOT EXISTS idx_jd_verifier ON job_directions(verifier_id) WHERE verifier_id IS NOT NULL;

-- 4. New special_task status
ALTER TYPE special_task_status ADD VALUE IF NOT EXISTS 'pending_verification';

-- 5. Verification columns on special_tasks
ALTER TABLE special_tasks
  ADD COLUMN IF NOT EXISTS requires_supervisor_verification BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verifier_id                      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at                      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes               TEXT;

CREATE INDEX IF NOT EXISTS idx_st_verifier ON special_tasks(verifier_id) WHERE verifier_id IS NOT NULL;

-- RLS: allow the designated verifier to update items pending their verification
-- (Appended to existing RLS policies — no DROP required)

-- job_directions: verifier can approve/reject
CREATE POLICY "verifier can update pending jd"
  ON job_directions FOR UPDATE
  USING (
    verifier_id = auth.uid()
    AND status = 'pending_verification'
  );

-- special_tasks: verifier can approve/reject
CREATE POLICY "verifier can update pending task"
  ON special_tasks FOR UPDATE
  USING (
    verifier_id = auth.uid()
    AND status = 'pending_verification'
  );
