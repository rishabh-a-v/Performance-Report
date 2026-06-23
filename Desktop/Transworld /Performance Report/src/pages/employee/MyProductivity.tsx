import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { ScoreGauge } from '@/components/charts/ScoreGauge'
import { TrendLine } from '@/components/charts/TrendLine'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { tasksByUser, PERF_SNAPSHOTS, PERSONAL_TREND, BLOCKERS } from '@/lib/mockData'
import { completionRate, formatDate, formatRelative, hoursBlocked } from '@/lib/utils'
import { CheckSquare, Clock, Zap, BarChart3, AlertTriangle } from 'lucide-react'

export function MyProductivity() {
  const { user } = useAuth()
  if (!user) return null

  const tasks = tasksByUser(user.id)
  const snap  = PERF_SNAPSHOTS.find((s) => s.user_id === user.id)
  const myBlockers = BLOCKERS.filter((b) => b.employee_id === user.id)

  const thisWeekDone = tasks.filter(
    (t) => t.status === 'done' && t.completed_at &&
      new Date(t.completed_at) > new Date(Date.now() - 7 * 86400000),
  )
  const avgCycle = snap?.avg_cycle_time_hours ?? null
  const totalBlockedHrs = myBlockers.reduce((s, b) => s + (b.hours_blocked ?? 0), 0)
  const rate = completionRate(
    tasks.filter((t) => t.status === 'done').length,
    tasks.length,
  )
  const kpiScore = snap?.kpi_score ?? 76

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard title="Completed This Week" value={thisWeekDone.length}    icon={CheckSquare}  delta={2}   iconColor="text-emerald-600" />
        <KPICard title="Completion Rate"      value={`${rate}%`}            icon={BarChart3}    delta={3.5} iconColor="text-blue-600" />
        <KPICard title="Avg Cycle Time"       value={avgCycle ? `${avgCycle}h` : '—'} icon={Clock} delta={-8} invertDelta iconColor="text-amber-600" />
        <KPICard title="Total Blocked Time"   value={`${totalBlockedHrs}h`} icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gauge */}
        <Card className="flex flex-col items-center justify-center py-8">
          <ScoreGauge score={kpiScore} label="Personal KPI" size="lg" />
          <p className="mt-4 text-center text-xs text-slate-400 max-w-[160px]">
            Based on completion rate, cycle time, and blocked time
          </p>
        </Card>

        {/* Trend */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>6-Week Performance Trend</CardTitle></CardHeader>
          <TrendLine
            data={PERSONAL_TREND}
            xKey="week"
            series={[
              { key: 'completed', color: '#10b981', label: 'Tasks Completed' },
              { key: 'kpi',       color: '#5568f5', label: 'KPI Score' },
              { key: 'blocked',   color: '#ef4444', label: 'Blocked Days' },
            ]}
            yDomain={[0, 100]}
          />
        </Card>
      </div>

      {/* Recent completed tasks */}
      <Card padding={false}>
        <div className="border-b border-slate-100 p-4">
          <CardTitle>Recently Completed Tasks</CardTitle>
        </div>
        <div className="divide-y divide-slate-50">
          {tasks.filter((t) => t.status === 'done').length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No completed tasks yet.</p>
          ) : (
            tasks
              .filter((t) => t.status === 'done')
              .map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-4 px-4 py-3 hover:bg-slate-50/60">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    {task.completed_at && (
                      <p className="text-xs text-slate-400">Completed {formatRelative(task.completed_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {task.cycle_time_hours && (
                      <span className="text-xs text-slate-400">{task.cycle_time_hours}h cycle</span>
                    )}
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))
          )}
        </div>
      </Card>

      {/* Blocker history */}
      {myBlockers.length > 0 && (
        <Card padding={false}>
          <div className="border-b border-slate-100 p-4">
            <CardTitle>Blocker History</CardTitle>
          </div>
          <div className="divide-y divide-slate-50">
            {myBlockers.map((b) => (
              <div key={b.id} className="px-4 py-3 hover:bg-slate-50/60">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm text-slate-700">{b.description}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${b.resolved_at ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {b.resolved_at ? 'Resolved' : `Active · ${b.hours_blocked}h`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Reported {formatRelative(b.reported_at)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
