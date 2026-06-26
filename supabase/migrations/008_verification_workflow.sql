-- ============================================================
-- Migration 008: Verification Workflow & RBAC Overhaul
-- ============================================================

-- ── 1. New role ───────────────────────────────────────────────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'executive_assistant';

-- ── 2. New statuses ───────────────────────────────────────────
ALTER TYPE job_direction_status ADD VALUE IF NOT EXISTS 'pending_verification';
ALTER TYPE special_task_status  ADD VALUE IF NOT EXISTS 'pending_verification';

-- ── 3a. Verification columns on job_directions ────────────────
ALTER TABLE job_directions
  ADD COLUMN IF NOT EXISTS requires_supervisor_verification BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verifier_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_jd_verifier
  ON job_directions(verifier_id) WHERE verifier_id IS NOT NULL;

-- ── 3b. Verification columns on special_tasks ─────────────────
ALTER TABLE special_tasks
  ADD COLUMN IF NOT EXISTS requires_supervisor_verification BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verifier_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_st_verifier
  ON special_tasks(verifier_id) WHERE verifier_id IS NOT NULL;

-- ── 3c. Verification columns on tasks ─────────────────────────
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS requires_supervisor_verification BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verifier_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ── 4. EA = MD: update auth_role() — one change covers all policies ──
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    CASE WHEN role = 'executive_assistant'
         THEN 'managing_director'::user_role
         ELSE role
    END
  FROM profiles WHERE id = auth.uid();
$$;

-- ── 5. Verifier RLS: supervisors can see & act on pending items ──

-- job_directions: supervisor can SELECT items assigned to their report (pending their sign-off)
CREATE POLICY "job_directions: verifier select"
  ON job_directions FOR SELECT
  USING (verifier_id = auth.uid());

-- job_directions: supervisor can UPDATE to approve or reject
CREATE POLICY "job_directions: verifier update"
  ON job_directions FOR UPDATE
  USING (verifier_id = auth.uid());

-- special_tasks: supervisor can SELECT items assigned to their report (pending their sign-off)
CREATE POLICY "special_tasks: verifier select"
  ON special_tasks FOR SELECT
  USING (verifier_id = auth.uid());

-- special_tasks: supervisor can UPDATE to approve or reject
CREATE POLICY "special_tasks: verifier update"
  ON special_tasks FOR UPDATE
  USING (verifier_id = auth.uid());

-- ── 6. Profiles visibility: all active employees can see all active profiles ──
-- Required so "Assigned By" / "Assigned To" columns resolve names across the org
CREATE POLICY "profiles: all active read all active"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- ── 7. Seed: update EA profile role ──────────────────────────────────────────
UPDATE profiles
  SET role = 'executive_assistant', updated_at = now()
  WHERE email = 'fin.head@transworld.com';
