import type { PerformanceCategory, EmployeePerformanceScore } from '@/types/database'
import { PROFILES, PERF_SNAPSHOTS, JOB_DIRECTIONS, TASKS } from '@/lib/mockData'

const WEIGHTS = {
  task_completion: 0.30,
  kpi_achievement: 0.25,
  productivity:    0.20,
  timeliness:      0.15,
  manager_feedback:0.10,
}

function scoreCategory(score: number): PerformanceCategory {
  if (score >= 90) return 'exceptional'
  if (score >= 75) return 'exceeds_expectations'
  if (score >= 60) return 'meets_expectations'
  if (score >= 40) return 'needs_improvement'
  return 'critical_attention'
}

export function categoryLabel(cat: PerformanceCategory): string {
  const MAP: Record<PerformanceCategory, string> = {
    exceptional:          'Exceptional',
    exceeds_expectations: 'Exceeds Expectations',
    meets_expectations:   'Meets Expectations',
    needs_improvement:    'Needs Improvement',
    critical_attention:   'Critical Attention',
  }
  return MAP[cat]
}

export function categoryColor(cat: PerformanceCategory): string {
  const MAP: Record<PerformanceCategory, string> = {
    exceptional:          'text-emerald-700 bg-emerald-50 border-emerald-200',
    exceeds_expectations: 'text-blue-700 bg-blue-50 border-blue-200',
    meets_expectations:   'text-slate-700 bg-slate-50 border-slate-200',
    needs_improvement:    'text-amber-700 bg-amber-50 border-amber-200',
    critical_attention:   'text-red-700 bg-red-50 border-red-200',
  }
  return MAP[cat]
}

export function categoryDot(cat: PerformanceCategory): string {
  const MAP: Record<PerformanceCategory, string> = {
    exceptional:          'bg-emerald-500',
    exceeds_expectations: 'bg-blue-500',
    meets_expectations:   'bg-slate-400',
    needs_improvement:    'bg-amber-500',
    critical_attention:   'bg-red-500',
  }
  return MAP[cat]
}

export function scoreBarColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 75) return 'bg-blue-500'
  if (score >= 60) return 'bg-slate-400'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

export function computePerformanceScores(period = 'Jun 2026'): EmployeePerformanceScore[] {
  const today = new Date().toISOString()

  return PROFILES.filter((p) => p.is_active).map((profile) => {
    // 1. Task completion score — from PERF_SNAPSHOTS or derived from tasks
    const snap = PERF_SNAPSHOTS.find((s) => s.user_id === profile.id)
    const taskCompletionScore = snap
      ? Math.min(100, snap.completion_rate)
      : (() => {
          const myTasks = TASKS.filter((t) => t.assignee_id === profile.id)
          if (!myTasks.length) return 65
          const done = myTasks.filter((t) => t.status === 'done').length
          return Math.round((done / myTasks.length) * 100)
        })()

    // 2. KPI achievement — from Job Directions average progress
    const myJDs = JOB_DIRECTIONS.filter((jd) => jd.employee_id === profile.id)
    const kpiAchievementScore = myJDs.length
      ? Math.min(100, Math.round(myJDs.reduce((s, jd) => s + jd.progress_percentage, 0) / myJDs.length))
      : snap?.kpi_score ?? 65

    // 3. Productivity — tasks completed per week proxy
    const productivityScore = snap
      ? Math.min(100, Math.round(snap.kpi_score * 0.95))
      : 62

    // 4. Timeliness — % of completed tasks that were on time
    const completedTasks = TASKS.filter((t) => t.assignee_id === profile.id && t.status === 'done')
    const timelinesScore = completedTasks.length
      ? (() => {
          const onTime = completedTasks.filter(
            (t) => t.completed_at && t.due_date && t.completed_at.slice(0, 10) <= t.due_date,
          ).length
          return Math.round((onTime / completedTasks.length) * 100)
        })()
      : 70

    // 5. Manager feedback — derive from JD review notes and snap score
    const approvedJDs = myJDs.filter((jd) => jd.status === 'approved').length
    const rejectedJDs = myJDs.filter((jd) => jd.status === 'rejected').length
    const managerFeedbackScore = myJDs.length
      ? Math.min(100, Math.max(0, Math.round(
          ((approvedJDs * 1.0 + (myJDs.length - approvedJDs - rejectedJDs) * 0.7 - rejectedJDs * 0.2) / myJDs.length) * 100,
        )))
      : 70

    const total = Math.round(
      taskCompletionScore  * WEIGHTS.task_completion  +
      kpiAchievementScore  * WEIGHTS.kpi_achievement  +
      productivityScore    * WEIGHTS.productivity     +
      timelinesScore       * WEIGHTS.timeliness       +
      managerFeedbackScore * WEIGHTS.manager_feedback,
    )

    return {
      user_id:               profile.id,
      period,
      task_completion_score: taskCompletionScore,
      kpi_achievement_score: kpiAchievementScore,
      productivity_score:    productivityScore,
      timeliness_score:      timelinesScore,
      manager_feedback_score:managerFeedbackScore,
      total_score:           total,
      category:              scoreCategory(total),
      computed_at:           today,
    } satisfies EmployeePerformanceScore
  })
}

export function computeCSCKPIs(report: {
  hhg_packing_jobs: number
  customers_called_packing: number
  or_dc_commercial_moves: number
  customers_called_move: number
  in_transit_shipments: number
  customers_called_transit: number
}) {
  const packing  = report.hhg_packing_jobs > 0 ? (report.customers_called_packing / report.hhg_packing_jobs) * 100 : 0
  const move     = report.or_dc_commercial_moves > 0 ? (report.customers_called_move / report.or_dc_commercial_moves) * 100 : 0
  const transit  = report.in_transit_shipments > 0 ? (report.customers_called_transit / report.in_transit_shipments) * 100 : 0
  const productivity = Math.round((packing + move + transit) / 3)
  return {
    packing_followup_rate:    Math.min(100, Math.round(packing)),
    move_coordination_rate:   Math.min(100, Math.round(move)),
    transit_monitoring_rate:  Math.min(100, Math.round(transit)),
    daily_productivity_score: Math.min(100, productivity),
  }
}

export function computeCETKPIs(report: {
  estimations_reviewed: number
  estimations_corrected: number
  jobs_confirmed: number
  quotes_pending: number
  total_estimate_value: number
}) {
  const correctionAccuracy = report.estimations_reviewed > 0
    ? Math.round((report.estimations_corrected / report.estimations_reviewed) * 100)
    : 0
  const conversionRate = report.estimations_reviewed > 0
    ? Math.round((report.jobs_confirmed / report.estimations_reviewed) * 100)
    : 0
  return {
    review_productivity:  report.estimations_reviewed,
    correction_accuracy:  correctionAccuracy,
    conversion_rate:      conversionRate,
    quote_backlog:        report.quotes_pending,
    revenue_generated:    report.total_estimate_value,
  }
}
