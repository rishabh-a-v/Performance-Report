-- ============================================================
-- Enterprise Management Intelligence Platform
-- Migration 001: Core Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- fast text search

-- ─────────────────────────────────────────────────────────────
-- ENUMs
-- ─────────────────────────────────────────────────────────────
CREATE TYPE user_role      AS ENUM ('employee', 'manager', 'department_head', 'executive');
CREATE TYPE task_status    AS ENUM ('backlog', 'ready', 'in_progress', 'blocked', 'done');
CREATE TYPE task_priority  AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE audit_status   AS ENUM ('assigned', 'in_progress', 'completed', 'pending');
CREATE TYPE invoice_status AS ENUM ('pending', 'processed', 'overdue', 'cancelled');
CREATE TYPE notif_type     AS ENUM ('info', 'warning', 'danger', 'success');
CREATE TYPE ai_scope       AS ENUM ('employee', 'team', 'department', 'executive');

-- ─────────────────────────────────────────────────────────────
-- DEPARTMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE departments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  head_id    UUID,               -- FK to profiles, set later
  budget     NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  avatar_url      TEXT,
  role            user_role NOT NULL DEFAULT 'employee',
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  manager_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  employee_code   TEXT UNIQUE,
  designation     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Back-fill FK
ALTER TABLE departments
  ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  status           task_status   NOT NULL DEFAULT 'backlog',
  priority         task_priority NOT NULL DEFAULT 'medium',
  assignee_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL REFERENCES profiles(id),
  department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
  due_date         DATE,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  cycle_time_hours INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN started_at IS NOT NULL AND completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600
      ELSE NULL
    END
  ) STORED,
  estimated_hours  INTEGER,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_assignee    ON tasks(assignee_id);
CREATE INDEX idx_tasks_department  ON tasks(department_id);
CREATE INDEX idx_tasks_status      ON tasks(status);
CREATE INDEX idx_tasks_due_date    ON tasks(due_date);
CREATE INDEX idx_tasks_created_at  ON tasks(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- DAILY CHECK-INS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE daily_checkins (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_yesterday   TEXT NOT NULL,
  focus_today           TEXT NOT NULL,
  is_blocked            BOOLEAN NOT NULL DEFAULT FALSE,
  blocker_description   TEXT,
  mood_score            SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, checkin_date)   -- one per day per user
);

CREATE TABLE checkin_task_links (
  checkin_id UUID NOT NULL REFERENCES daily_checkins(id) ON DELETE CASCADE,
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (checkin_id, task_id)
);

CREATE INDEX idx_checkins_user_date ON daily_checkins(user_id, checkin_date DESC);

-- ─────────────────────────────────────────────────────────────
-- BLOCKERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE blockers (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES tasks(id) ON DELETE SET NULL,
  description      TEXT NOT NULL,
  reported_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  resolved_by      UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  hours_blocked    INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN resolved_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (resolved_at - reported_at)) / 3600
      ELSE EXTRACT(EPOCH FROM (NOW() - reported_at)) / 3600
    END
  ) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blockers_employee ON blockers(employee_id);
CREATE INDEX idx_blockers_active   ON blockers(resolved_at) WHERE resolved_at IS NULL;

-- ─────────────────────────────────────────────────────────────
-- KPIs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE kpis (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES profiles(id)     ON DELETE CASCADE,
  department_id  UUID REFERENCES departments(id)  ON DELETE CASCADE,
  metric_name    TEXT NOT NULL,
  target_value   NUMERIC(10,2) NOT NULL,
  actual_value   NUMERIC(10,2) NOT NULL,
  unit           TEXT NOT NULL DEFAULT '%',
  period         TEXT NOT NULL,   -- e.g. '2024-W24' or '2024-Q2'
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR department_id IS NOT NULL)
);

-- ─────────────────────────────────────────────────────────────
-- PERFORMANCE SNAPSHOTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE performance_snapshots (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_assigned        INTEGER NOT NULL DEFAULT 0,
  tasks_completed       INTEGER NOT NULL DEFAULT 0,
  tasks_blocked         INTEGER NOT NULL DEFAULT 0,
  avg_cycle_time_hours  NUMERIC(8,2),
  completion_rate       NUMERIC(5,2) NOT NULL DEFAULT 0,
  kpi_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, snapshot_date)
);

CREATE INDEX idx_perf_user_date ON performance_snapshots(user_id, snapshot_date DESC);

CREATE TABLE department_snapshots (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id         UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  snapshot_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  active_tasks          INTEGER NOT NULL DEFAULT 0,
  completed_tasks       INTEGER NOT NULL DEFAULT 0,
  blocked_tasks         INTEGER NOT NULL DEFAULT 0,
  avg_cycle_time_hours  NUMERIC(8,2),
  utilization_pct       NUMERIC(5,2) NOT NULL DEFAULT 0,
  efficiency_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  kpi_score             NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, snapshot_date)
);

-- ─────────────────────────────────────────────────────────────
-- FINANCE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  TEXT NOT NULL UNIQUE,
  client_name     TEXT NOT NULL,
  amount          NUMERIC(14,2) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  status          invoice_status NOT NULL DEFAULT 'pending',
  issued_date     DATE NOT NULL,
  due_date        DATE NOT NULL,
  paid_date       DATE,
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_status    ON invoices(status);
CREATE INDEX idx_invoices_due_date  ON invoices(due_date);

CREATE TABLE audits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  status          audit_status NOT NULL DEFAULT 'assigned',
  assigned_to     UUID NOT NULL REFERENCES profiles(id),
  department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
  due_date        DATE,
  completed_date  DATE,
  created_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE finance_kpis (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id               UUID REFERENCES departments(id) ON DELETE CASCADE,
  period                      TEXT NOT NULL,
  dso_days                    NUMERIC(6,2),
  invoice_processing_time_hrs NUMERIC(8,2),
  cost_per_invoice            NUMERIC(10,2),
  audit_completion_rate       NUMERIC(5,2),
  collection_rate             NUMERIC(5,2),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  type        notif_type NOT NULL DEFAULT 'info',
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, read) WHERE NOT read;

-- ─────────────────────────────────────────────────────────────
-- AI INSIGHTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope           ai_scope NOT NULL,
  target_id       UUID NOT NULL,   -- user_id or department_id
  period          TEXT NOT NULL,
  summary         TEXT NOT NULL,
  risks           TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_target ON ai_insights(scope, target_id, generated_at DESC);
