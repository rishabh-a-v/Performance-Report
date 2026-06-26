-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Helper function: get the calling user's role
CREATE OR REPLACE FUNCTION auth_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Helper function: get the calling user's manager id
CREATE OR REPLACE FUNCTION auth_manager_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT manager_id FROM profiles WHERE id = auth.uid();
$$;

-- Helper function: get the calling user's department id
CREATE OR REPLACE FUNCTION auth_dept_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$;

-- Helper function: is the calling user a manager of a given user_id?
CREATE OR REPLACE FUNCTION is_manager_of(target_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = target_user_id AND manager_id = auth.uid()
  );
$$;

-- Helper function: is the calling user a dept head of a given dept_id?
CREATE OR REPLACE FUNCTION is_dept_head_of(dept UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM departments WHERE id = dept AND head_id = auth.uid()
  );
$$;

-- ─── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_task_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits                ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_kpis          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights           ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES ────────────────────────────────────────────────
-- Everyone can read their own profile
CREATE POLICY "profiles: self read"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Managers can read their direct reports
CREATE POLICY "profiles: manager read reports"
  ON profiles FOR SELECT
  USING (manager_id = auth.uid());

-- Dept heads can read all profiles in their dept
CREATE POLICY "profiles: dept head read dept"
  ON profiles FOR SELECT
  USING (department_id = auth_dept_id() AND auth_role() IN ('director', 'managing_director'));

-- Executives see all profiles
CREATE POLICY "profiles: executive read all"
  ON profiles FOR SELECT
  USING (auth_role() = 'managing_director');

-- Users can update their own profile (non-sensitive fields)
CREATE POLICY "profiles: self update"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ─── TASKS ───────────────────────────────────────────────────
-- Employees see only their own tasks
CREATE POLICY "tasks: assignee read"
  ON tasks FOR SELECT
  USING (assignee_id = auth.uid());

-- Managers see tasks of their direct reports
CREATE POLICY "tasks: manager read team tasks"
  ON tasks FOR SELECT
  USING (is_manager_of(assignee_id));

-- Dept heads see all tasks in their department
CREATE POLICY "tasks: dept head read dept tasks"
  ON tasks FOR SELECT
  USING (department_id = auth_dept_id() AND auth_role() IN ('director', 'managing_director'));

-- Executives see all tasks
CREATE POLICY "tasks: executive read all"
  ON tasks FOR SELECT
  USING (auth_role() = 'managing_director');

-- Managers and above can create tasks
CREATE POLICY "tasks: manager create"
  ON tasks FOR INSERT
  WITH CHECK (auth_role() IN ('manager', 'director', 'managing_director'));

-- Employees can update status of their own tasks
CREATE POLICY "tasks: assignee update status"
  ON tasks FOR UPDATE
  USING (assignee_id = auth.uid())
  WITH CHECK (assignee_id = auth.uid());

-- Managers can update any task in their team
CREATE POLICY "tasks: manager update team"
  ON tasks FOR UPDATE
  USING (is_manager_of(assignee_id));

-- ─── DAILY CHECK-INS ─────────────────────────────────────────
-- Employees see only their own check-ins
CREATE POLICY "checkins: self read"
  ON daily_checkins FOR SELECT
  USING (user_id = auth.uid());

-- Managers see their team's check-ins
CREATE POLICY "checkins: manager read team"
  ON daily_checkins FOR SELECT
  USING (is_manager_of(user_id));

-- Dept heads and executives see all check-ins in their scope
CREATE POLICY "checkins: dept head read"
  ON daily_checkins FOR SELECT
  USING (
    auth_role() IN ('director', 'managing_director') AND
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_id AND p.department_id = auth_dept_id())
  );

CREATE POLICY "checkins: executive read all"
  ON daily_checkins FOR SELECT
  USING (auth_role() = 'managing_director');

-- Users can insert their own check-in
CREATE POLICY "checkins: self insert"
  ON daily_checkins FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ─── BLOCKERS ────────────────────────────────────────────────
CREATE POLICY "blockers: self read"
  ON blockers FOR SELECT USING (employee_id = auth.uid());

CREATE POLICY "blockers: manager read"
  ON blockers FOR SELECT USING (is_manager_of(employee_id));

CREATE POLICY "blockers: dept head read"
  ON blockers FOR SELECT
  USING (auth_role() IN ('director', 'managing_director'));

CREATE POLICY "blockers: self insert"
  ON blockers FOR INSERT WITH CHECK (employee_id = auth.uid());

CREATE POLICY "blockers: manager resolve"
  ON blockers FOR UPDATE
  USING (is_manager_of(employee_id));

-- ─── PERFORMANCE SNAPSHOTS ───────────────────────────────────
CREATE POLICY "perf_snap: self read"
  ON performance_snapshots FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "perf_snap: manager read team"
  ON performance_snapshots FOR SELECT USING (is_manager_of(user_id));

CREATE POLICY "perf_snap: executive read all"
  ON performance_snapshots FOR SELECT USING (auth_role() IN ('director', 'managing_director'));

-- ─── DEPARTMENT SNAPSHOTS ────────────────────────────────────
-- Dept heads read their own department, executives read all
CREATE POLICY "dept_snap: dept head read"
  ON department_snapshots FOR SELECT
  USING (
    department_id = auth_dept_id() OR auth_role() = 'managing_director'
  );

-- ─── FINANCE ─────────────────────────────────────────────────
CREATE POLICY "invoices: finance and above"
  ON invoices FOR SELECT
  USING (auth_role() IN ('director', 'managing_director'));

CREATE POLICY "invoices: insert finance"
  ON invoices FOR INSERT
  WITH CHECK (auth_role() IN ('director', 'managing_director'));

CREATE POLICY "audits: finance read"
  ON audits FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "finance_kpis: finance and above"
  ON finance_kpis FOR SELECT
  USING (auth_role() IN ('director', 'managing_director'));

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE POLICY "notifications: own only"
  ON notifications FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── AI INSIGHTS ─────────────────────────────────────────────
CREATE POLICY "ai_insights: self and above"
  ON ai_insights FOR SELECT
  USING (
    target_id = auth.uid() OR
    auth_role() IN ('manager', 'director', 'managing_director')
  );
