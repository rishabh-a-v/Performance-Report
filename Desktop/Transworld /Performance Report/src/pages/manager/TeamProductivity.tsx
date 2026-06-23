import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TaskProgressDrawer } from '@/components/tasks/TaskProgressDrawer'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import { useTaskStore } from '@/store/taskStore'
import { PROFILES, DEPARTMENTS, reportees } from '@/lib/mockData'
import {
  calcForecast, progressPct,
  formatQuantity, isMeasurable, progressSummary, isMilestone, isValue,
} from '@/lib/kpiEngine'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'
import {
  Target, TrendingUp, AlertTriangle, CheckCircle2, Plus,
  ArrowUpDown, Filter,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

type SortKey = 'pct' | 'remaining' | 'due'
type SortDir = 'asc' | 'desc'

const CHART_COLORS = ['#5568f5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

export function TeamProductivity() {
  const { user } = useAuth()
  const { tasks, milestones, getHistoryForTask } = useTaskStore()

  const [deptFilter, setDeptFilter]   = useState('all')
  const [sortKey, setSortKey]         = useState<SortKey>('pct')
  const [sortDir, setSortDir]         = useState<SortDir>('asc')
  const [updateTask, setUpdateTask]   = useState<Task | null>(null)
  const [showCreate, setShowCreate]   = useState(false)

  if (!user) return null

  // Build member list (team = user's direct reports + self for managers)
  const team = reportees(user.id)
  const memberIds = team.map((m) => m.id)

  // All measurable tasks across team (and all if dept head/exec)
  const canSeeAll = user.role === 'department_head' || user.role === 'executive'
  const measurable = tasks.filter((t) =>
    isMeasurable(t) && (canSeeAll || memberIds.includes(t.assignee_id)),
  )

  // Apply dept filter
  const deptFiltered = deptFilter === 'all'
    ? measurable
    : measurable.filter((t) => t.department_id === deptFilter)

  // Compute row data
  const rows = useMemo(() => {
    return deptFiltered.map((task) => {
      const pct       = progressPct(task, milestones)
      const forecast  = calcForecast(task, milestones)
      const assignee  = PROFILES.find((p) => p.id === task.assignee_id)
      const dept      = DEPARTMENTS.find((d) => d.id === task.department_id)
      const throughput = forecast?.dailyThroughput ?? 0
      const remaining = isMilestone(task)
        ? milestones.filter((m) => m.task_id === task.id && !m.completed).length
        : isValue(task)
          ? (task.target_value ?? 0) - (task.current_value ?? 0)
          : (task.target_quantity ?? 0) - (task.completed_quantity ?? 0)
      const dueMs     = task.due_date ? new Date(task.due_date).getTime() : Infinity
      return { task, pct, forecast, assignee, dept, throughput, remaining, dueMs }
    })
  }, [deptFiltered, milestones])

  // Sort
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let diff = 0
      if (sortKey === 'pct')        diff = a.pct - b.pct
      if (sortKey === 'remaining')  diff = a.remaining - b.remaining
      if (sortKey === 'due')        diff = a.dueMs - b.dueMs
      return sortDir === 'asc' ? diff : -diff
    })
  }, [rows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  // Aggregate KPIs
  const onTrack  = rows.filter((r) => r.forecast?.isOnTrack).length
  const atRisk   = rows.filter((r) => r.forecast?.isAtRisk).length
  const behind   = rows.filter((r) => r.forecast?.isBehind).length
  const avgPct   = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0

  // Throughput trend data for top 3 tasks by target quantity
  const topTasks = [...measurable].sort((a, b) => (b.target_quantity ?? 0) - (a.target_quantity ?? 0)).slice(0, 3)
  const trendMap: Record<string, Record<string, number>> = {}
  topTasks.forEach((t) => {
    getHistoryForTask(t.id).forEach((h) => {
      if (!trendMap[h.recorded_date]) trendMap[h.recorded_date] = { date: h.recorded_date as unknown as number }
      const label = t.title.length > 20 ? t.title.slice(0, 20) + '…' : t.title
      trendMap[h.recorded_date][label] = h.progress_percentage
    })
  })
  const trendData = Object.values(trendMap).sort((a, b) =>
    String(a.date).localeCompare(String(b.date)),
  ).map((row) => ({ ...row, date: String(row.date).slice(5) }))

  function SortButton({ k, label }: { k: SortKey; label: string }) {
    return (
      <button
        onClick={() => toggleSort(k)}
        className={cn(
          'flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors',
          sortKey === k ? 'text-brand-600' : 'text-slate-400 hover:text-slate-700',
        )}
      >
        {label}
        <ArrowUpDown size={10} className={sortKey === k ? 'text-brand-500' : 'text-slate-300'} />
      </button>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Team Productivity</h2>
          <p className="text-xs text-slate-400 mt-0.5">Outcome-based progress across all measurable tasks</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"
        >
          <Plus size={13} />
          New Task
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Measurable Tasks" value={measurable.length} icon={Target} iconColor="text-brand-600" />
        <KPICard title="Avg Progress"     value={`${avgPct}%`}      icon={TrendingUp}    iconColor="text-emerald-600" />
        <KPICard title="On Track"         value={onTrack}            icon={CheckCircle2}  iconColor="text-emerald-600" />
        <KPICard title="At Risk / Behind" value={atRisk + behind}    icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      {/* Progress trend chart */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Trend — Top Tasks</CardTitle>
          </CardHeader>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`]}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                {topTasks.map((t, i) => {
                  const label = t.title.length > 20 ? t.title.slice(0, 20) + '…' : t.title
                  return (
                    <Line
                      key={t.id}
                      type="monotone"
                      dataKey={label}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} className="text-slate-400" />
        <span className="text-xs text-slate-500 font-medium">Department:</span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {[{ id: 'all', name: 'All' }, ...DEPARTMENTS].map((d) => (
            <button
              key={d.id}
              onClick={() => setDeptFilter(d.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                deptFilter === d.id ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Assignee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Task</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</th>
                <th className="px-4 py-3 text-left">
                  <SortButton k="pct" label="Progress" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SortButton k="due" label="Due" />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-slate-400">
                    No measurable tasks for this filter.
                  </td>
                </tr>
              ) : (
                sorted.map(({ task, pct, forecast, assignee, remaining }) => (
                  <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      {assignee ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={assignee.full_name} size="sm" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{assignee.full_name}</p>
                            <p className="text-[10px] text-slate-400">{assignee.designation ?? assignee.role}</p>
                          </div>
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{task.title}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {progressSummary(task, milestones)}
                    </td>
                    <td className="px-4 py-3 min-w-[140px]">
                      <ProgressBar value={pct} size="sm" className="mb-1" />
                      {!isMilestone(task) && (
                        <p className="text-xs text-slate-500 tabular-nums">
                          {typeof remaining === 'number' ? formatQuantity(Math.max(0, remaining)) : remaining} left
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                        : '—'
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setUpdateTask(task)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            {sorted.length} measurable tasks · {onTrack} on track · {atRisk} at risk · {behind} behind
          </div>
        )}
      </Card>

      {updateTask && (
        <TaskProgressDrawer task={updateTask} onClose={() => setUpdateTask(null)} />
      )}
      {showCreate && (
        <TaskCreateModal
          currentUserId={user.id}
          defaultDeptId={user.department_id}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
