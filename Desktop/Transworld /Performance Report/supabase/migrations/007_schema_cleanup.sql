-- ============================================================
-- Migration 007: Drop Deprecated Tables & Orphaned Objects
-- ============================================================

-- ── Group A: Department-Specific Reporting ──────────────────
DROP TABLE IF EXISTS csc_daily_reports         CASCADE;
DROP TABLE IF EXISTS cet_daily_reports         CASCADE;
DROP TABLE IF EXISTS eqb_orders                CASCADE;
DROP TABLE IF EXISTS unbilled_reports          CASCADE;
DROP TABLE IF EXISTS daily_performance_reports CASCADE;
DROP TABLE IF EXISTS branches                  CASCADE;

-- ── Group B: Employee Review / Performance System ───────────
DROP TABLE IF EXISTS performance_reviews         CASCADE;
DROP TABLE IF EXISTS employee_performance_scores CASCADE;
DROP TABLE IF EXISTS performance_snapshots       CASCADE;
DROP TABLE IF EXISTS department_snapshots        CASCADE;

-- ── Group C: Finance System ──────────────────────────────────
DROP TABLE IF EXISTS invoices     CASCADE;
DROP TABLE IF EXISTS audits       CASCADE;
DROP TABLE IF EXISTS finance_kpis CASCADE;

-- ── Group D: KPIs ─────────────────────────────────────────────
DROP TABLE IF EXISTS kpis CASCADE;

-- ── Orphaned standalone functions ─────────────────────────────
DROP FUNCTION IF EXISTS compute_performance_snapshot(UUID);
DROP FUNCTION IF EXISTS compute_department_snapshot(UUID);

-- ── Orphaned enums (no remaining table uses these) ────────────
DROP TYPE IF EXISTS audit_status;
DROP TYPE IF EXISTS invoice_status;
