import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { TrendLine } from '@/components/charts/TrendLine'
import { WorkloadBar } from '@/components/charts/WorkloadBar'
import { CompletionDonut } from '@/components/charts/CompletionDonut'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useTaskStore } from '@/store/taskStore'
import { TASKS, PROFILES, BLOCKERS, DEPARTMENTS, PERF_SNAPSHOTS, COMPLETION_TREND } from '@/lib/mockData'
import { completionRate, cn } from '@/lib/utils'
import { calcForecast, forecastBg, progressPct, formatQuantity, isMeasurable, forecastDateStr } from '@/lib/kpiEngine'
import { BarChart3, Clock, AlertTriangle, Zap, TrendingDown, Activity, Target, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

export function Analytics() {
  const { getMeasurableTasks } = useTaskStore()
  const measurable = getMeasurableTasks()
  const employees = PROFILES.filter((p) => p.role === 'executive')

  // Overall efficiency metrics
  const done    = TASKS.filter((t) => t.status === 'done').length
  const active  = TASKS.filter((t) => t.status === 'in_progress').length
  const blocked = TASKS.filter((t) => t.status === 'blocked').length
  const rate    = completionRate(done, TASKS.length)

  const completedWithCycle = TASKS.filter((t) => t.cycle_time_hours != null)
  const avgCycle = completedWithCycle.length
    ? Math.round(completedWithCycle.reduce((s, t) => s + (t.cycle_time_hours ?? 0), 0) / completedWithCycle.length)
    : 0

  const totalBlockedHrs = BLOCKERS.reduce((s, b) => s + (b.hours_blocked ?? 0), 0)
  const throughputPerWeek = Math.round(done / 6)   // 6 weeks of data

  // Overloaded / underutilised
  const utilisation = employees.map((emp) => {
    const t = TASKS.filter((tk) => tk.assignee_id === emp.id)
    const snap = PERF_SNAPSHOTS.find((s) => s.user_id === emp.id)
    return {
      emp,
      count: t.length,
      kpi: snap?.kpi_score ?? 70,
      utilPct: snap ? Math.min(100, Math.round((t.filter((tk) => tk.status !== 'done').length / Math.max(t.length, 1)) * 100 + 40)) : 60,
    }
  })
  const overloaded    = utilisation.filter((u) => u.utilPct >= 90)
  const underutilised = utilisation.filter((u) => u.utilPct <= 50)

  // WIP analysis by dept
  const wipData = DEPARTMENTS.map((d) => {
    const dt = TASKS.filter((t) => t.department_id === d.id)
    return {
      name: d.name.slice(0, 5),
      completed: dt.filter((t) => t.status === 'done').length,
      active:    dt.filter((t) => t.status === 'in_progress').length,
      blocked:   dt.filter((t) => t.status === 'blocked').length,
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Efficiency metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Completion Rate"    value={`${rate}%`}         icon={BarChart3}     delta={2.4} iconColor="text-blue-600" />
        <KPICard title="Avg Cycle Time"     value={`${avgCycle}h`}     icon={Clock}         invertDelta delta={-4} iconColor="text-amber-600" />
        <KPICard title="Total Blocked Hrs"  value={`${totalBlockedHrs}h`} icon={AlertTriangle} iconColor="text-red-500" invertDelta />
        <KPICard title="Throughput / Week"  value={throughputPerWeek}  icon={Zap}           delta={1} iconColor="text-emerald-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task distribution donut */}
        <Card>
          <CardHeader><CardTitle>Task Distribution</CardTitle></CardHeader>
          <CompletionDonut done={done} active={active} blocked={blocked} />
        </Card>

        {/* Completion trend */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Completion Rate Trend — All Depts</CardTitle></CardHeader>
          <TrendLine
            data={COMPLETION_TREND}
            xKey="week"
            series={[
              { key: 'engineering', color: '#5568f5', label: 'Eng' },
              { key: 'finance',     color: '#10b981', label: 'Finance' },
              { key: 'sales',       color: '#f59e0b', label: 'Sales' },
              { key: 'operations',  color: '#06b6d4', label: 'Ops' },
              { key: 'hr',          color: '#a855f7', label: 'HR' },
            ]}
            yDomain={[50, 100]}
            unit="%"
          />
        </Card>
      </div>

      {/* WIP analysis */}
      <Card>
        <CardHeader><CardTitle>WIP Analysis by Department</CardTitle></CardHeader>
        <WorkloadBar data={wipData} height={240} />
      </Card>

      {/* Capacity analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown size={14} className="text-red-500" />
              Potentially Overloaded ({overloaded.length})
            </CardTitle>
          </CardHeader>
          {overloaded.length === 0 ? (
            <p className="text-sm text-slate-400">No overloaded employees detected.</p>
          ) : (
            <div className="space-y-3">
              {overloaded.map(({ emp, count, utilPct }) => (
                <div key={emp.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{emp.full_name}</p>
                    <p className="text-xs text-slate-400">{count} active tasks</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${Math.min(utilPct, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-red-600">{utilPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              Bottleneck Detection
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {TASKS.filter((t) => t.status === 'blocked').map((task) => {
              const dept = DEPARTMENTS.find((d) => d.id === task.department_id)
              return (
                <div key={task.id} className="rounded-lg bg-red-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-slate-800">{task.title}</p>
                    <span className="shrink-0 rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">Blocked</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">{dept?.name} · Due {task.due_date}</p>
                </div>
              )
            })}
            {TASKS.filter((t) => t.status === 'blocked').length === 0 && (
              <p className="text-sm text-slate-400">No blocked tasks — no bottlenecks detected.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ─── Outcome-Based Productivity ───────────────────────── */}
      {measurable.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <Target size={15} className="text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800">Outcome-Based Productivity</h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily throughput bar chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-brand-500" />
                  Daily Throughput (units/day avg)
                </CardTitle>
              </CardHeader>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={measurable.map((t) => {
                      const f = calcForecast(t)
                      return {
                        name: t.title.length > 18 ? t.title.slice(0, 18) + '…' : t.title,
                        throughput: f?.dailyThroughput ?? 0,
                        unit: t.unit,
                      }
                    })}
                    margin={{ top: 4, right: 16, bottom: 32, left: -8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      formatter={(v: number, _, props) => [`${v} ${props.payload?.unit ?? 'units'}/day`]}
                    />
                    {measurable.map((_, i) => (
                      <Cell key={i} fill={['#5568f5','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'][i % 7]} />
                    ))}
                    <Bar dataKey="throughput" radius={[4, 4, 0, 0]}>
                      {measurable.map((_, i) => (
                        <Cell key={i} fill={['#5568f5','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'][i % 7]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Forecast completion dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={13} className="text-brand-500" />
                  Forecast Completion Dates
                </CardTitle>
              </CardHeader>
              <div className="space-y-2.5">
                {measurable.map((task) => {
                  const pct = progressPct(task)
                  const forecast = calcForecast(task)
                  const assignee = PROFILES.find((p) => p.id === task.assignee_id)
                  return (
                    <div key={task.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {assignee?.full_name} · {formatQuantity(task.completed_quantity ?? 0)}/{formatQuantity(task.target_quantity ?? 0)} {task.unit}
                          </p>
                        </div>
                        {forecast ? (
                          <span className={cn('ml-3 shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium', forecastBg(forecast))}>
                            {forecastDateStr(forecast)}
                          </span>
                        ) : (
                          <span className="ml-3 shrink-0 text-xs text-slate-300">—</span>
                        )}
                      </div>
                      <ProgressBar value={pct} size="xs" showLabel={false} />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          {/* Tasks At Risk / Behind widgets */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* At Risk */}
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={13} className="text-amber-600" />
                  At Risk
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {measurable
                  .filter((t) => {
                    const f = calcForecast(t)
                    return f?.isAtRisk
                  })
                  .map((t) => {
                    const f = calcForecast(t)!
                    return (
                      <div key={t.id} className="rounded-lg bg-white p-2.5 shadow-sm">
                        <p className="text-xs font-semibold text-slate-800">{t.title}</p>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          Needs {Math.ceil(f.daysToComplete)}d · Due in {f.daysUntilDue}d
                        </p>
                        <ProgressBar value={progressPct(t)} size="xs" showLabel={false} className="mt-1.5" />
                      </div>
                    )
                  })}
                {measurable.filter((t) => calcForecast(t)?.isAtRisk).length === 0 && (
                  <p className="text-xs text-slate-400">No tasks at risk.</p>
                )}
              </div>
            </Card>

            {/* Highest performers */}
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <TrendingUp size={13} className="text-emerald-600" />
                  Highest Throughput
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {[...measurable]
                  .map((t) => ({ t, f: calcForecast(t) }))
                  .filter((x) => x.f && x.f.dailyThroughput > 0)
                  .sort((a, b) => (b.f!.dailyThroughput) - (a.f!.dailyThroughput))
                  .slice(0, 4)
                  .map(({ t, f }) => {
                    const assignee = PROFILES.find((p) => p.id === t.assignee_id)
                    return (
                      <div key={t.id} className="flex items-center gap-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 truncate">{t.title}</p>
                          <p className="text-[10px] text-slate-400">{assignee?.full_name}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-emerald-700 tabular-nums">
                          {f!.dailyThroughput} {t.unit}/day
                        </span>
                      </div>
                    )
                  })}
                {measurable.filter((t) => (calcForecast(t)?.dailyThroughput ?? 0) > 0).length === 0 && (
                  <p className="text-xs text-slate-400">No throughput data yet.</p>
                )}
              </div>
            </Card>

            {/* Lowest progress */}
            <Card className="border-red-200 bg-red-50/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <TrendingDown size={13} className="text-red-600" />
                  Lowest Progress
                </CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {[...measurable]
                  .sort((a, b) => progressPct(a) - progressPct(b))
                  .slice(0, 4)
                  .map((t) => {
                    const pct = progressPct(t)
                    const assignee = PROFILES.find((p) => p.id === t.assignee_id)
                    return (
                      <div key={t.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-slate-800 truncate flex-1 min-w-0">{t.title}</p>
                          <span className="ml-2 shrink-0 text-xs font-bold text-red-700 tabular-nums">{Math.round(pct)}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{assignee?.full_name}</p>
                        <ProgressBar value={pct} size="xs" showLabel={false} />
                      </div>
                    )
                  })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
