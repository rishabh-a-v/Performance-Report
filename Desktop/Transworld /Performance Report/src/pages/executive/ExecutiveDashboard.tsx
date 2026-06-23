import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { TrendLine } from '@/components/charts/TrendLine'
import { WorkloadBar } from '@/components/charts/WorkloadBar'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTaskStore } from '@/store/taskStore'
import { useBlockerStore } from '@/store/blockerStore'
import {
  PROFILES, TASKS, DEPARTMENTS, DEPT_SNAPSHOTS,
  BLOCKERS, COMPLETION_TREND, REVENUE_TREND,
} from '@/lib/mockData'
import { completionRate, currency, cn } from '@/lib/utils'
import { calcForecast, forecastBg, progressPct, formatQuantity, isMeasurable } from '@/lib/kpiEngine'
import {
  Users, CheckSquare, TrendingUp, AlertTriangle,
  Building2, DollarSign, Zap, ShieldAlert, Target,
} from 'lucide-react'

const DEPT_COLORS: Record<string, string> = {
  d1: '#5568f5',
  d2: '#10b981',
  d3: '#f59e0b',
  d4: '#06b6d4',
  d5: '#a855f7',
}

function DeptOutcomeSection() {
  const { getMeasurableTasks } = useTaskStore()
  const measurable = getMeasurableTasks()

  if (measurable.length === 0) return null

  // Group tasks by department then by unit label
  const byDept = DEPARTMENTS.map((dept) => {
    const deptTasks = measurable.filter((t) => t.department_id === dept.id)
    if (!deptTasks.length) return null

    // Group by unit for aggregation
    const byUnit: Record<string, { target: number; completed: number; tasks: typeof deptTasks }> = {}
    deptTasks.forEach((t) => {
      const key = t.unit ?? 'Items'
      if (!byUnit[key]) byUnit[key] = { target: 0, completed: 0, tasks: [] }
      byUnit[key].target += t.target_quantity ?? 0
      byUnit[key].completed += t.completed_quantity ?? 0
      byUnit[key].tasks.push(t)
    })

    return { dept, byUnit }
  }).filter(Boolean) as { dept: typeof DEPARTMENTS[0]; byUnit: Record<string, { target: number; completed: number; tasks: ReturnType<typeof getMeasurableTasks> }> }[]

  if (!byDept.length) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target size={15} className="text-brand-600" />
          <CardTitle>Department Outcome Progress</CardTitle>
        </div>
        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          {measurable.length} measurable tasks
        </span>
      </CardHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {byDept.map(({ dept, byUnit }) => (
          <div key={dept.id} className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{dept.name}</p>
            {Object.entries(byUnit).map(([unit, { target, completed }]) => {
              const pct = target > 0 ? Math.round((completed / target) * 100) : 0
              return (
                <div key={unit} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700 truncate">{unit}</span>
                    <span className="ml-2 shrink-0 text-xs font-bold text-slate-900 tabular-nums">
                      {formatQuantity(completed)} / {formatQuantity(target)}
                    </span>
                  </div>
                  <ProgressBar value={pct} size="sm" />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function ExecutiveDashboard() {
  const { blockers: liveBlockers } = useBlockerStore()
  const totalEmployees  = PROFILES.filter((p) => p.is_active).length
  const totalTasks      = TASKS.length
  const doneTasks       = TASKS.filter((t) => t.status === 'done').length
  const blockedTasks    = TASKS.filter((t) => t.status === 'blocked').length
  const activeBlockers  = liveBlockers.filter((b) => !b.resolved_at)
  const companyRate     = completionRate(doneTasks, totalTasks)
  const avgKpi          = Math.round(DEPT_SNAPSHOTS.reduce((s, d) => s + d.kpi_score, 0) / DEPT_SNAPSHOTS.length)

  // Department rankings by KPI
  const deptRankings = DEPT_SNAPSHOTS.map((snap) => {
    const dept = DEPARTMENTS.find((d) => d.id === snap.department_id)
    return {
      dept,
      snap,
      rate: completionRate(snap.completed_tasks, snap.active_tasks + snap.completed_tasks),
    }
  }).sort((a, b) => b.snap.kpi_score - a.snap.kpi_score)

  // Workload bar data
  const workloadData = DEPT_SNAPSHOTS.map((snap) => {
    const dept = DEPARTMENTS.find((d) => d.id === snap.department_id)
    return {
      name: dept?.name.slice(0, 5) ?? '?',
      completed: snap.completed_tasks,
      active: snap.active_tasks,
      blocked: snap.blocked_tasks,
    }
  })

  // Completion trend across depts
  const completionTrendSeries = DEPARTMENTS.map((d) => ({
    key: d.name.toLowerCase(),
    color: DEPT_COLORS[d.id] ?? '#94a3b8',
    label: d.name,
  }))

  // Revenue trend series
  const revenueSeries = [
    { key: 'invoiced',  color: '#5568f5', label: 'Invoiced' },
    { key: 'collected', color: '#10b981', label: 'Collected' },
  ]

  // Risk scores
  const riskFlags = [
    ...TASKS.filter((t) => t.status === 'blocked').map((t) => ({
      type: 'blocked_task',
      severity: 'high',
      message: `Task "${t.title}" has been blocked`,
    })),
    ...DEPT_SNAPSHOTS.filter((s) => s.kpi_score < 72).map((s) => {
      const dept = DEPARTMENTS.find((d) => d.id === s.department_id)
      return {
        type: 'dept_underperforming',
        severity: 'medium',
        message: `${dept?.name} KPI score is ${s.kpi_score} — below 72 threshold`,
      }
    }),
    ...activeBlockers.filter((b) => (b.hours_blocked ?? 0) > 48).map((b) => {
      const emp = PROFILES.find((p) => p.id === b.employee_id)
      return {
        type: 'long_block',
        severity: 'critical',
        message: `${emp?.full_name} blocked for ${b.hours_blocked}h — escalation required`,
      }
    }),
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Company-wide KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Total Employees"  value={totalEmployees} icon={Users}         iconColor="text-blue-600" />
        <KPICard title="Company Rate"     value={`${companyRate}%`} icon={TrendingUp} delta={1.8} iconColor="text-emerald-600" />
        <KPICard title="Active Tasks"     value={TASKS.filter((t) => t.status === 'in_progress').length} icon={CheckSquare} iconColor="text-brand-600" />
        <KPICard title="Active Blockers"  value={activeBlockers.length} icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Avg Company KPI"  value={avgKpi}          icon={Zap}          iconColor="text-brand-500" />
        <KPICard title="Departments"      value={DEPARTMENTS.length} icon={Building2} iconColor="text-slate-600" />
        <KPICard title="Total Invoiced"   value={currency(1540000)} icon={DollarSign} iconColor="text-emerald-600" subtitle="Jun 2026" />
        <KPICard title="Risk Score"       value={riskFlags.filter((r) => r.severity === 'critical').length > 0 ? 'High' : 'Moderate'} icon={ShieldAlert} iconColor="text-amber-600" />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Completion Rate — All Departments</CardTitle></CardHeader>
          <TrendLine
            data={COMPLETION_TREND}
            xKey="week"
            series={completionTrendSeries}
            yDomain={[50, 100]}
            unit="%"
          />
        </Card>
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <TrendLine
            data={REVENUE_TREND}
            xKey="month"
            series={revenueSeries}
            yFormatter={(v) => v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(1)}Cr` : v >= 100_000 ? `₹${(v / 100_000).toFixed(0)}L` : `₹${(v / 1_000).toFixed(0)}K`}
          />
        </Card>
      </div>

      {/* Department rankings + workload */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rankings */}
        <Card padding={false}>
          <div className="border-b border-slate-100 p-4">
            <CardTitle>Department Rankings</CardTitle>
          </div>
          <div className="divide-y divide-slate-50">
            {deptRankings.map(({ dept, snap, rate }, idx) => (
              <div key={snap.department_id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60">
                <span className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  idx === 0 ? 'bg-amber-100 text-amber-700' :
                  idx === 1 ? 'bg-slate-100 text-slate-600' :
                  idx === 2 ? 'bg-orange-50 text-orange-600' :
                              'bg-white text-slate-400 border border-slate-200',
                )}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{dept?.name}</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-xs text-slate-500">Efficiency: <strong>{snap.efficiency_score}</strong></span>
                    <span className="text-xs text-slate-500">Util: <strong>{snap.utilization_pct}%</strong></span>
                    <span className="text-xs text-red-500">{snap.blocked_tasks} blocked</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <ScoreGauge score={snap.kpi_score} size="sm" label="KPI" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Workload */}
        <Card>
          <CardHeader><CardTitle>Company-Wide Workload</CardTitle></CardHeader>
          <WorkloadBar data={workloadData} />
        </Card>
      </div>

      {/* Department Outcome Progress */}
      <DeptOutcomeSection />

      {/* Strategic risk panel */}
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-red-600" />
            <CardTitle className="text-red-800">Strategic Risk Panel</CardTitle>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
            {riskFlags.length} flags
          </span>
        </CardHeader>
        <div className="space-y-2">
          {riskFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active risk flags.</p>
          ) : (
            riskFlags.map((flag, i) => (
              <div key={i} className={cn(
                'flex items-start gap-3 rounded-lg border p-3',
                flag.severity === 'critical' ? 'border-red-300 bg-red-100' :
                flag.severity === 'high'     ? 'border-orange-200 bg-orange-50' :
                                               'border-amber-200 bg-amber-50',
              )}>
                <AlertTriangle size={13} className={cn(
                  'mt-0.5 shrink-0',
                  flag.severity === 'critical' ? 'text-red-600' :
                  flag.severity === 'high'     ? 'text-orange-600' : 'text-amber-600',
                )} />
                <p className={cn(
                  'text-xs leading-relaxed',
                  flag.severity === 'critical' ? 'text-red-800' : 'text-slate-700',
                )}>
                  <strong className="capitalize">{flag.severity}</strong> — {flag.message}
                </p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
