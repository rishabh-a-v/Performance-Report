-- ============================================================
-- Migration 006: Role-Based Access Control (RBAC)
-- ============================================================

-- ── 1. Extend user_role enum with the two missing values ─────
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'executive_assistant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr';

-- ── 2. Ensure profiles has branch + phone_no columns ─────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS branch   TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_no TEXT UNIQUE;

-- ── 3. Promote HR-department managers to the 'hr' role ───────
-- Only managers in the HR department are promoted; executives
-- in the same department retain the 'executive' role.
UPDATE profiles
SET role = 'hr'
WHERE role = 'manager'
  AND department_id = (
    SELECT id FROM departments WHERE LOWER(name) = 'hr' LIMIT 1
  );

-- ── 4. role_permissions table ────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  id                         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  role                       TEXT        NOT NULL UNIQUE,
  label                      TEXT        NOT NULL,
  can_view_all_branches      BOOLEAN     NOT NULL DEFAULT false,
  can_view_all_departments   BOOLEAN     NOT NULL DEFAULT false,
  can_filter_branch          BOOLEAN     NOT NULL DEFAULT false,
  can_filter_department      BOOLEAN     NOT NULL DEFAULT false,
  must_be_in_reporting_chain BOOLEAN     NOT NULL DEFAULT false,
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                 UUID        REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ── 5. Seed baseline permissions ─────────────────────────────
INSERT INTO role_permissions
  (role, label,
   can_view_all_branches, can_view_all_departments,
   can_filter_branch, can_filter_department,
   must_be_in_reporting_chain)
VALUES
  ('managing_director',   'Managing Director',   true,  true,  true,  true,  false),
  ('executive_assistant', 'Executive Assistant', true,  true,  true,  true,  false),
  ('hr',                  'HR',                  true,  true,  true,  true,  false),
  ('director',            'Director',            false, true,  false, true,  false),
  ('manager',             'Manager',             false, false, false, false, true),
  ('executive',           'Executive',           false, false, false, false, false)
ON CONFLICT (role) DO NOTHING;

-- ── 6. Auto-maintain updated_at on role_permissions ──────────
CREATE OR REPLACE FUNCTION touch_role_permissions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON role_permissions;
CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON role_permissions
  FOR EACH ROW EXECUTE FUNCTION touch_role_permissions_updated_at();

-- ── 7. RLS for role_permissions ───────────────────────────────
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Every authenticated user can read the full permissions table
-- (needed so the frontend can fetch the current user's config)
DROP POLICY IF EXISTS "role_permissions: public read" ON role_permissions;
CREATE POLICY "role_permissions: public read"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only MD / EA / HR may update rows
DROP POLICY IF EXISTS "role_permissions: admin update" ON role_permissions;
CREATE POLICY "role_permissions: admin update"
  ON role_permissions FOR UPDATE
  USING  (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'))
  WITH CHECK (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'));

-- ── 8. Patch existing "read all" RLS policies ─────────────────
-- The original policies only granted MD access to all data.
-- We extend them to include EA and HR.

DROP POLICY IF EXISTS "profiles: executive read all" ON profiles;
CREATE POLICY "profiles: executive read all"
  ON profiles FOR SELECT
  USING (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'));

-- Director-level branch-scoped read (already covers directors via their
-- department_id; this adds EA / HR parity)
DROP POLICY IF EXISTS "profiles: dept head read dept" ON profiles;
CREATE POLICY "profiles: dept head read dept"
  ON profiles FOR SELECT
  USING (
    department_id = auth_dept_id()
    AND auth_role()::text IN ('director', 'managing_director', 'executive_assistant', 'hr')
  );

-- Allow MD / EA / HR to update any profile (for ManageEmployees admin page)
DROP POLICY IF EXISTS "profiles: admin update any" ON profiles;
CREATE POLICY "profiles: admin update any"
  ON profiles FOR UPDATE
  USING  (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'))
  WITH CHECK (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'));

-- ── 9. special_tasks & task_assignees scoping ─────────────────
-- Ensure MD / EA / HR can read all special tasks
DO $$ BEGIN
  DROP POLICY IF EXISTS "special_tasks: admin read all" ON special_tasks;
  CREATE POLICY "special_tasks: admin read all"
    ON special_tasks FOR SELECT
    USING (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ── 10. job_directions scoping ────────────────────────────────
DO $$ BEGIN
  DROP POLICY IF EXISTS "job_directions: admin read all" ON job_directions;
  CREATE POLICY "job_directions: admin read all"
    ON job_directions FOR SELECT
    USING (auth_role()::text IN ('managing_director', 'executive_assistant', 'hr'));
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
