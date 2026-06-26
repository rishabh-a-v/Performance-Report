-- ============================================================
-- Enterprise Management Intelligence Platform
-- Migration 006: Additional Tables & Operations Schema
-- ============================================================

-- ─── ENUMs ──────────────────────────────────────────────────
CREATE TYPE job_direction_status AS ENUM ('draft', 'active', 'submitted', 'approved', 'rejected', 'completed');
CREATE TYPE job_direction_progress_type AS ENUM ('quantity', 'value', 'milestone');
CREATE TYPE special_task_status AS ENUM ('pending', 'in_progress', 'on_hold', 'completed');
CREATE TYPE eqb_order_status AS ENUM ('generated', 'confirmed', 'cancelled');
CREATE TYPE review_type AS ENUM ('self', 'subordinate', 'company');
CREATE TYPE review_status AS ENUM ('draft', 'submitted', 'approved', 'rejected');
CREATE TYPE performance_category AS ENUM ('exceptional', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'critical_attention');
CREATE TYPE change_request_status AS ENUM ('pending', 'approved', 'rejected');

-- ─── BRANCHES ───────────────────────────────────────────────
CREATE TABLE branches (
  id      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name    TEXT NOT NULL,
  city    TEXT NOT NULL,
  state   TEXT NOT NULL,
  head_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── JOB DIRECTIONS ─────────────────────────────────────────
CREATE TABLE job_directions (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title                   TEXT NOT NULL,
  description             TEXT,
  employee_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  manager_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id           UUID REFERENCES departments(id) ON DELETE SET NULL,
  progress_type           job_direction_progress_type NOT NULL,
  target_value            NUMERIC(15,2),
  current_value           NUMERIC(15,2),
  unit                    TEXT,
  progress_percentage     NUMERIC(5,2) NOT NULL DEFAULT 0,
  status                  job_direction_status NOT NULL DEFAULT 'draft',
  review_notes            TEXT,
  due_date                DATE,
  submitted_for_review_at TIMESTAMPTZ,
  approved_at             TIMESTAMPTZ,
  rejected_at             TIMESTAMPTZ,
  pending_edits           JSONB, -- { title: string, description: string, target_value: number }
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── JD MILESTONES ──────────────────────────────────────────
CREATE TABLE jd_milestones (
  id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_direction_id TEXT NOT NULL REFERENCES job_directions(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  weight           NUMERIC(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  completed        BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at     TIMESTAMPTZ,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SPECIAL TASKS ──────────────────────────────────────────
CREATE TABLE special_tasks (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title       TEXT NOT NULL,
  description TEXT,
  assigned_to UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  priority    task_priority NOT NULL DEFAULT 'medium',
  due_date    DATE,
  status      special_task_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── CSC DAILY REPORTS ──────────────────────────────────────
CREATE TABLE csc_daily_reports (
  id                       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id                TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  report_date              DATE NOT NULL,
  hhg_packing_jobs         INTEGER NOT NULL DEFAULT 0,
  customers_called_packing INTEGER NOT NULL DEFAULT 0,
  or_dc_commercial_moves   INTEGER NOT NULL DEFAULT 0,
  customers_called_move    INTEGER NOT NULL DEFAULT 0,
  in_transit_shipments     INTEGER NOT NULL DEFAULT 0,
  customers_called_transit  INTEGER NOT NULL DEFAULT 0,
  challenges               TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, report_date)
);

-- ─── CET DAILY REPORTS ──────────────────────────────────────
CREATE TABLE cet_daily_reports (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  branch_id             TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  report_date           DATE NOT NULL,
  estimations_reviewed  INTEGER NOT NULL DEFAULT 0,
  estimations_corrected INTEGER NOT NULL DEFAULT 0,
  jobs_confirmed        INTEGER NOT NULL DEFAULT 0,
  quotes_pending        INTEGER NOT NULL DEFAULT 0,
  total_estimate_value  NUMERIC(15,2) NOT NULL DEFAULT 0,
  challenges            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, report_date)
);

-- ─── EQB ORDERS ─────────────────────────────────────────────
CREATE TABLE eqb_orders (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_id   TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_date  DATE NOT NULL,
  order_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL,
  status      eqb_order_status NOT NULL DEFAULT 'generated',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── UNBILLED REPORTS ───────────────────────────────────────
CREATE TABLE unbilled_reports (
  id                         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_id                  TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  employee_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date                DATE NOT NULL,
  pending_pos                INTEGER NOT NULL DEFAULT 0,
  pending_po_value           NUMERIC(15,2) NOT NULL DEFAULT 0,
  completed_jobs_not_billed  INTEGER NOT NULL DEFAULT 0,
  unbilled_job_value         NUMERIC(15,2) NOT NULL DEFAULT 0,
  damages_pending            INTEGER NOT NULL DEFAULT 0,
  damage_value               NUMERIC(15,2) NOT NULL DEFAULT 0,
  billed_jobs                INTEGER NOT NULL DEFAULT 0,
  total_completed_jobs       INTEGER NOT NULL DEFAULT 0,
  resolved_damages           INTEGER NOT NULL DEFAULT 0,
  closed_pos                 INTEGER NOT NULL DEFAULT 0,
  remarks                    TEXT,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (branch_id, report_date)
);

-- ─── DAILY PERFORMANCE REPORTS (DPR) ────────────────────────
CREATE TABLE daily_performance_reports (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  branch_id             TEXT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  submitted_by          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  report_date           DATE NOT NULL,
  daily_revenue         NUMERIC(15,2) NOT NULL DEFAULT 0,
  jobs_completed        INTEGER NOT NULL DEFAULT 0,
  jobs_open             INTEGER NOT NULL DEFAULT 0,
  jobs_delayed          INTEGER NOT NULL DEFAULT 0,
  pending_billing       INTEGER NOT NULL DEFAULT 0,
  pending_damage_claims INTEGER NOT NULL DEFAULT 0,
  customer_followups    INTEGER NOT NULL DEFAULT 0,
  challenges            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (branch_id, report_date)
);

-- ─── EMPLOYEE PERFORMANCE SCORES ────────────────────────────
CREATE TABLE employee_performance_scores (
  user_id                UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period                 TEXT NOT NULL,
  task_completion_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
  kpi_achievement_score  NUMERIC(5,2) NOT NULL DEFAULT 0,
  productivity_score     NUMERIC(5,2) NOT NULL DEFAULT 0,
  timeliness_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  manager_feedback_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score            NUMERIC(5,2) NOT NULL DEFAULT 0,
  category               performance_category NOT NULL,
  computed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, period)
);

-- ─── PERFORMANCE REVIEWS ────────────────────────────────────
CREATE TABLE performance_reviews (
  id                     TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  employee_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  employee_name          TEXT NOT NULL,
  employee_role          TEXT NOT NULL,
  review_period          TEXT NOT NULL,
  review_type            review_type NOT NULL,
  reviewed_employee_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_employee_name TEXT,
  objectives_assigned    TEXT,
  objectives_completed   TEXT,
  progress_percentage    NUMERIC(5,2),
  achievements           TEXT,
  challenges             TEXT,
  support_required       TEXT,
  next_period_goals      TEXT,
  company_performance    TEXT,
  branch_performance     TEXT,
  department_performance TEXT,
  major_risks            TEXT,
  strategic_decisions    TEXT,
  future_plans           TEXT,
  rating                 SMALLINT CHECK (rating BETWEEN 1 AND 5),
  areas_for_improvement  TEXT,
  manager_comments       TEXT,
  recommended_action     TEXT,
  status                 review_status NOT NULL DEFAULT 'draft',
  submitted_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rejection_note         TEXT
);

-- ─── DATE CHANGE REQUESTS ───────────────────────────────────
CREATE TABLE date_change_requests (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  task_id           UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  task_title        TEXT NOT NULL,
  requested_by_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_by_name TEXT NOT NULL,
  "current_date"    DATE,
  requested_date    DATE NOT NULL,
  reason            TEXT NOT NULL,
  status            change_request_status NOT NULL DEFAULT 'pending',
  reviewed_by_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by_name  TEXT,
  reviewed_at       TIMESTAMPTZ,
  rejection_note    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Enable RLS on all additional tables ─────────────────────
ALTER TABLE branches                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_directions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_milestones               ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE csc_daily_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cet_daily_reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE eqb_orders                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE unbilled_reports            ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_performance_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_change_requests        ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────

-- 1. Branches: Read for everyone, write only for managing directors
CREATE POLICY "branches: read authenticated"
  ON branches FOR SELECT USING (true);

CREATE POLICY "branches: md write"
  ON branches FOR ALL USING (auth_role() = 'managing_director');

-- 2. Job Directions
CREATE POLICY "job_directions: select scope"
  ON job_directions FOR SELECT
  USING (
    employee_id = auth.uid() OR
    manager_id = auth.uid() OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "job_directions: insert scope"
  ON job_directions FOR INSERT
  WITH CHECK (
    employee_id = auth.uid() OR
    manager_id = auth.uid() OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "job_directions: update scope"
  ON job_directions FOR UPDATE
  USING (
    employee_id = auth.uid() OR
    manager_id = auth.uid() OR
    auth_role() IN ('director', 'managing_director')
  );

-- 3. JD Milestones
CREATE POLICY "jd_milestones: select scope"
  ON jd_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_directions jd
      WHERE jd.id = job_direction_id AND (
        jd.employee_id = auth.uid() OR
        jd.manager_id = auth.uid() OR
        auth_role() IN ('director', 'managing_director')
      )
    )
  );

CREATE POLICY "jd_milestones: modify scope"
  ON jd_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM job_directions jd
      WHERE jd.id = job_direction_id AND (
        jd.employee_id = auth.uid() OR
        jd.manager_id = auth.uid() OR
        auth_role() IN ('director', 'managing_director')
      )
    )
  );

-- 4. Special Tasks
CREATE POLICY "special_tasks: select scope"
  ON special_tasks FOR SELECT
  USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "special_tasks: employee update status"
  ON special_tasks FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "special_tasks: manager full"
  ON special_tasks FOR ALL
  USING (
    assigned_by = auth.uid() OR
    auth_role() IN ('director', 'managing_director')
  );

-- 5. CSC Reports
CREATE POLICY "csc_daily_reports: select scope"
  ON csc_daily_reports FOR SELECT
  USING (
    employee_id = auth.uid() OR
    is_manager_of(employee_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "csc_daily_reports: employee write"
  ON csc_daily_reports FOR ALL
  USING (employee_id = auth.uid());

-- 6. CET Reports
CREATE POLICY "cet_daily_reports: select scope"
  ON cet_daily_reports FOR SELECT
  USING (
    employee_id = auth.uid() OR
    is_manager_of(employee_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "cet_daily_reports: employee write"
  ON cet_daily_reports FOR ALL
  USING (employee_id = auth.uid());

-- 7. EQB Orders
CREATE POLICY "eqb_orders: select scope"
  ON eqb_orders FOR SELECT
  USING (
    employee_id = auth.uid() OR
    is_manager_of(employee_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "eqb_orders: employee write"
  ON eqb_orders FOR ALL
  USING (employee_id = auth.uid());

-- 8. Unbilled Reports
CREATE POLICY "unbilled_reports: select scope"
  ON unbilled_reports FOR SELECT
  USING (
    employee_id = auth.uid() OR
    is_manager_of(employee_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "unbilled_reports: employee write"
  ON unbilled_reports FOR ALL
  USING (employee_id = auth.uid());

-- 9. Daily Performance Reports (DPR)
CREATE POLICY "dpr: select scope"
  ON daily_performance_reports FOR SELECT
  USING (
    submitted_by = auth.uid() OR
    is_manager_of(submitted_by) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "dpr: employee write"
  ON daily_performance_reports FOR ALL
  USING (submitted_by = auth.uid());

-- 10. Performance Scores
CREATE POLICY "scores: select scope"
  ON employee_performance_scores FOR SELECT
  USING (
    user_id = auth.uid() OR
    is_manager_of(user_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "scores: admin write"
  ON employee_performance_scores FOR ALL
  USING (auth_role() IN ('director', 'managing_director'));

-- 11. Performance Reviews
CREATE POLICY "reviews: select scope"
  ON performance_reviews FOR SELECT
  USING (
    employee_id = auth.uid() OR
    reviewed_employee_id = auth.uid() OR
    is_manager_of(employee_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "reviews: employee write"
  ON performance_reviews FOR ALL
  USING (
    employee_id = auth.uid() OR
    reviewed_employee_id = auth.uid() OR
    is_manager_of(employee_id) OR
    auth_role() IN ('director', 'managing_director')
  );

-- 12. Date Change Requests
CREATE POLICY "change_requests: select scope"
  ON date_change_requests FOR SELECT
  USING (
    requested_by_id = auth.uid() OR
    is_manager_of(requested_by_id) OR
    auth_role() IN ('director', 'managing_director')
  );

CREATE POLICY "change_requests: employee insert"
  ON date_change_requests FOR INSERT
  WITH CHECK (requested_by_id = auth.uid());

CREATE POLICY "change_requests: reviewer update"
  ON date_change_requests FOR UPDATE
  USING (
    is_manager_of(requested_by_id) OR
    auth_role() IN ('director', 'managing_director')
  );

-- ─── Triggers for Touch Updated At ─────────────────────────────
CREATE TRIGGER trg_job_directions_updated_at
  BEFORE UPDATE ON job_directions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_special_tasks_updated_at
  BEFORE UPDATE ON special_tasks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_csc_daily_reports_updated_at
  BEFORE UPDATE ON csc_daily_reports
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_cet_daily_reports_updated_at
  BEFORE UPDATE ON cet_daily_reports
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_unbilled_reports_updated_at
  BEFORE UPDATE ON unbilled_reports
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
