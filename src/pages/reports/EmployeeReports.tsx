import { useState, useEffect, useMemo } from 'react'
import {
  BarChart2, TrendingUp, CheckCircle2, AlertCircle,
  Target, User, Users, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import {
  startOfDay, endOfDay, startOfMonth,
  startOfQuarter, subMonths, startOfYear,
} from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useProfileStore } from '@/store/profileStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useRBACFilter } from '@/hooks/useRBACFilter'
import { cn, formatDate, todayLocalISO } from '@/lib/utils'
import type { JDReportRow, TaskReportRow, TeamTaskReportRow, JobDirection, SpecialTask } from '@/types/database'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

// ── Period config ─────────────────────────────────────────────────────────────

type Period = 'daily' | 'monthly' | 'quarterly' | '3months' | '6months' | 'yearly'

const PERIODS: { key: Period; label: string }[] = [
  { key: 'daily',    label: 'Daily'     },
  { key: 'monthly',  label: 'Monthly'   },
  { key: 'quarterly',label: 'Quarterly' },
  { key: '3months',  label: '3 Months'  },
  { key: '6months',  label: '6 Months'  },
  { key: 'yearly',   label: 'Yearly'    },
]

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case 'daily':     return { start: startOfDay(now),     end: endOfDay(now) }
    case 'monthly':   return { start: startOfMonth(now),   end: now }
    case 'quarterly': return { start: startOfQuarter(now), end: now }
    case '3months':   return { start: subMonths(now, 3),   end: now }
    case '6months':   return { start: subMonths(now, 6),   end: now }
    case 'yearly':    return { start: startOfYear(now),    end: now }
  }
}

function periodLabel(period: Period): string {
  const now = new Date()
  switch (period) {
    case 'daily':     return `Today · ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
    case 'monthly':   return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    case 'quarterly': return `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
    case '3months':   return 'Last 3 Months'
    case '6months':   return 'Last 6 Months'
    case 'yearly':    return `Year ${now.getFullYear()}`
  }
}

// ── Sort helpers ─────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'
type TaskSortKey = 'task_name' | 'due_date' | 'completed_at' | 'status'
type TeamTaskSortKey = 'sub_task_title' | 'job_title' | 'due_date' | 'status'

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ChevronsUpDown size={12} className="text-slate-300 ml-1 inline shrink-0" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-blue-500 ml-1 inline shrink-0" />
    : <ChevronDown size={12} className="text-blue-500 ml-1 inline shrink-0" />
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color, bg }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 sm:p-5">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mb-3', bg)}>
        <Icon size={17} className={color} />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className={cn('text-3xl font-bold tabular-nums', color)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

const TASK_STATUS_STYLE: Record<string, string> = {
  'Yet to start': 'bg-slate-100 text-slate-500',
  'In progress':  'bg-blue-100 text-blue-700',
  Completed:      'bg-emerald-100 text-emerald-700',
  'In review':    'bg-purple-100 text-purple-700',
}

const TEAM_TASK_STATUS_STYLE: Record<string, string> = {
  'Yet to start': 'bg-slate-100 text-slate-500',
  'In progress':  'bg-blue-100 text-blue-700',
  Completed:      'bg-emerald-100 text-emerald-700',
}

const JD_STATUS_STYLE: Record<string, string> = {
  active:    'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  completed: 'bg-teal-100 text-teal-700',
  rejected:  'bg-red-100 text-red-600',
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function EmployeeReports() {
  const { user } = useAuth()
  const profiles   = useProfileStore((s) => s.profiles)
  const directions = useJobDirectionStore((s) => s.directions)
  const allTasks   = useSpecialTaskStore((s) => s.tasks)
  const { allowedProfiles } = useRBACFilter()

  const [selectedId, setSelectedId] = useState<string>(user?.id ?? '')
  const [period, setPeriod]         = useState<Period>('monthly')
  const [jdRows, setJdRows]             = useState<JDReportRow[]>([])
  const [taskRows, setTaskRows]         = useState<TaskReportRow[]>([])
  const [teamTaskRows, setTeamTaskRows] = useState<TeamTaskReportRow[]>([])
  const [loading, setLoading]           = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<
    { kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null
  >(null)
  const [taskSortKey, setTaskSortKey] = useState<TaskSortKey>('due_date')
  const [taskSortDir, setTaskSortDir] = useState<SortDir>('asc')
  const [teamTaskSortKey, setTeamTaskSortKey] = useState<TeamTaskSortKey>('due_date')
  const [teamTaskSortDir, setTeamTaskSortDir] = useState<SortDir>('asc')

  function toggleTaskSort(key: TaskSortKey) {
    if (taskSortKey === key) setTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setTaskSortKey(key); setTaskSortDir('asc') }
  }

  function toggleTeamTaskSort(key: TeamTaskSortKey) {
    if (teamTaskSortKey === key) setTeamTaskSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setTeamTaskSortKey(key); setTeamTaskSortDir('asc') }
  }

  // Default to self when user loads
  useEffect(() => {
    if (!selectedId && user?.id) setSelectedId(user.id)
  }, [user])

  // Fetch report data whenever employee or period changes
  useEffect(() => {
    if (!selectedId) return
    const { start, end } = getDateRange(period)
    fetchReport(selectedId, start.toISOString(), end.toISOString())
  }, [selectedId, period])

  async function fetchReport(empId: string, start: string, end: string) {
    setLoading(true)
    const [jdRes, taskRes, teamTaskRes] = await Promise.all([
      supabase.rpc('get_employee_jd_report', {
        p_employee_id: empId,
        p_start: start,
        p_end: end,
      }),
      supabase.rpc('get_employee_task_report', {
        p_employee_id: empId,
        p_start: start,
        p_end: end,
      }),
      supabase.rpc('get_employee_team_task_report', {
        p_employee_id: empId,
        p_start: start,
        p_end: end,
      }),
    ])

    if (jdRes.error)      console.error('JD report error:', jdRes.error)
    if (taskRes.error)    console.error('Task report error:', taskRes.error)
    if (teamTaskRes.error) console.error('Team task report error:', teamTaskRes.error)

    setJdRows((jdRes.data ?? []) as JDReportRow[])
    setTaskRows((taskRes.data ?? []) as TaskReportRow[])
    setTeamTaskRows((teamTaskRes.data ?? []) as TeamTaskReportRow[])
    setLoading(false)
  }

  // ── Derived stats ───────────────────────────────────────────────────────────

  const totalTarget   = useMemo(() => jdRows.reduce((s, r) => s + (r.monthly_target ?? 0), 0), [jdRows])
  const totalAchieved = useMemo(() => jdRows.reduce((s, r) => s + (r.achieved_in_period ?? 0), 0), [jdRows])
  const achievePct    = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0

  const today         = todayLocalISO()
  const taskCompleted = useMemo(() => taskRows.filter((t) => t.status === 'Completed').length, [taskRows])
  const taskOverdue   = useMemo(
    () => taskRows.filter((t) => t.due_date && t.due_date < today && t.status !== 'Completed').length,
    [taskRows, today],
  )

  const teamTaskCompleted = useMemo(() => teamTaskRows.filter((t) => t.status === 'Completed').length, [teamTaskRows])
  const teamTaskOverdue   = useMemo(
    () => teamTaskRows.filter((t) => t.due_date && t.due_date < today && t.status !== 'Completed').length,
    [teamTaskRows, today],
  )

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedId),
    [profiles, selectedId],
  )

  const sortedTaskRows = useMemo(() => {
    return [...taskRows].sort((a, b) => {
      const sign = taskSortDir === 'asc' ? 1 : -1
      if (taskSortKey === 'task_name') return sign * (a.task_name ?? '').localeCompare(b.task_name ?? '')
      if (taskSortKey === 'due_date') return sign * ((a.due_date ?? '9999') < (b.due_date ?? '9999') ? -1 : 1)
      if (taskSortKey === 'completed_at') return sign * ((a.completed_at ?? '') < (b.completed_at ?? '') ? -1 : 1)
      if (taskSortKey === 'status') return sign * (a.status ?? '').localeCompare(b.status ?? '')
      return 0
    })
  }, [taskRows, taskSortKey, taskSortDir])

  const sortedTeamTaskRows = useMemo(() => {
    return [...teamTaskRows].sort((a, b) => {
      const sign = teamTaskSortDir === 'asc' ? 1 : -1
      if (teamTaskSortKey === 'sub_task_title') return sign * (a.sub_task_title ?? '').localeCompare(b.sub_task_title ?? '')
      if (teamTaskSortKey === 'job_title') return sign * (a.job_title ?? '').localeCompare(b.job_title ?? '')
      if (teamTaskSortKey === 'due_date') return sign * ((a.due_date ?? '9999') < (b.due_date ?? '9999') ? -1 : 1)
      if (teamTaskSortKey === 'status') return sign * (a.status ?? '').localeCompare(b.status ?? '')
      return 0
    })
  }, [teamTaskRows, teamTaskSortKey, teamTaskSortDir])

  const showEmployeeSelector = allowedProfiles.length > 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Employee Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance overview across different time periods</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Employee selector */}
        {showEmployeeSelector ? (
          <div className="flex items-center gap-2">
            <User size={15} className="text-slate-400 shrink-0" />
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm"
            >
              {allowedProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User size={15} className="text-slate-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-700">{selectedProfile?.full_name ?? '—'}</span>
          </div>
        )}

        {/* Period tabs */}
        <div className="flex border-b border-slate-200">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                period === key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Period label */}
      <div className="flex items-center gap-2">
        <BarChart2 size={14} className="text-slate-400" />
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{periodLabel(period)}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <p className="text-sm font-medium">Loading report…</p>
        </div>
      ) : (
        <>
          {/* Summary KPI cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="JD Target"
              value={totalTarget.toLocaleString()}
              sub="Sum of monthly targets"
              icon={Target}
              color="text-blue-600"
              bg="bg-blue-50"
            />
            <StatCard
              label="JD Achieved"
              value={totalAchieved.toLocaleString()}
              sub={`${achievePct}% of target`}
              icon={TrendingUp}
              color={achievePct >= 100 ? 'text-emerald-600' : achievePct >= 50 ? 'text-amber-600' : 'text-red-500'}
              bg={achievePct >= 100 ? 'bg-emerald-50' : achievePct >= 50 ? 'bg-amber-50' : 'bg-red-50'}
            />
            <StatCard
              label="Tasks Completed"
              value={taskCompleted}
              sub={`of ${taskRows.length} total tasks`}
              icon={CheckCircle2}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatCard
              label="Tasks Overdue"
              value={taskOverdue}
              icon={AlertCircle}
              color={taskOverdue > 0 ? 'text-red-500' : 'text-slate-400'}
              bg={taskOverdue > 0 ? 'bg-red-50' : 'bg-slate-50'}
            />
          </div>

          {/* JD Breakdown */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">Job Directions — Progress in Period</h2>
            </div>
            {jdRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <BarChart2 size={28} className="opacity-25 mb-2" />
                <p className="text-sm font-medium">No job directions found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {jdRows.map((row) => {
                  const pct = row.monthly_target > 0
                    ? Math.min(100, Math.round((row.achieved_in_period / row.monthly_target) * 100))
                    : 0
                  const liveJD = directions.find((d) => d.id === row.id)
                  return (
                    <div
                      key={row.id}
                      onClick={() => liveJD && setSelectedDetail({ kind: 'jd', data: liveJD })}
                      className={cn('flex items-center gap-4 px-5 py-4 transition-colors', liveJD && 'cursor-pointer hover:bg-slate-50')}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', JD_STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-500')}>
                            {row.status}
                          </span>
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {row.work_details ?? '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden max-w-xs">
                            <div
                              className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500')}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 tabular-nums">{pct}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-800 tabular-nums">{row.achieved_in_period.toLocaleString()}</p>
                        <p className="text-[11px] text-slate-400">of {row.monthly_target.toLocaleString()}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Task Breakdown */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">Special Tasks</h2>
            </div>
            {taskRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <CheckCircle2 size={28} className="opacity-25 mb-2" />
                <p className="text-sm font-medium">No tasks found for this period</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <button onClick={() => toggleTaskSort('task_name')} className="flex items-center hover:text-blue-600 transition-colors">
                    Task<SortIcon active={taskSortKey === 'task_name'} dir={taskSortDir} />
                  </button>
                  <button onClick={() => toggleTaskSort('due_date')} className="flex items-center justify-end hover:text-blue-600 transition-colors">
                    Due Date<SortIcon active={taskSortKey === 'due_date'} dir={taskSortDir} />
                  </button>
                  <button onClick={() => toggleTaskSort('completed_at')} className="flex items-center justify-end hover:text-blue-600 transition-colors">
                    Completed<SortIcon active={taskSortKey === 'completed_at'} dir={taskSortDir} />
                  </button>
                  <button onClick={() => toggleTaskSort('status')} className="flex items-center justify-end w-24 hover:text-blue-600 transition-colors">
                    Status<SortIcon active={taskSortKey === 'status'} dir={taskSortDir} />
                  </button>
                </div>
                {sortedTaskRows.map((row) => {
                  const isOverdue = row.due_date && row.due_date < today && row.status !== 'Completed'
                  const liveTask  = allTasks.find((t) => t.id === row.id)
                  return (
                    <div
                      key={row.id}
                      onClick={() => liveTask && setSelectedDetail({ kind: 'st', data: liveTask })}
                      className={cn('grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 items-center px-5 py-3.5 transition-colors', liveTask && 'cursor-pointer hover:bg-slate-50')}
                    >
                      <p className="text-sm font-medium text-slate-800 truncate">{row.task_name}</p>
                      <p className={cn('text-xs font-medium text-right', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                        {row.due_date ? formatDate(row.due_date) : '—'}
                        {isOverdue && ' · Overdue'}
                      </p>
                      <p className="text-xs font-medium text-right text-emerald-600">
                        {row.completed_at ? formatDate(row.completed_at) : '—'}
                      </p>
                      <div className="flex sm:justify-end">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TASK_STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-500')}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Team Job Sub-tasks */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Team Job Sub-tasks</h2>
              <span className="text-xs text-slate-400 font-medium">
                {teamTaskCompleted} completed · {teamTaskOverdue} overdue
              </span>
            </div>
            {teamTaskRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Users size={28} className="opacity-25 mb-2" />
                <p className="text-sm font-medium">No team sub-tasks found for this period</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                <div className="hidden sm:grid grid-cols-[1fr_160px_auto_auto] gap-4 px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <button onClick={() => toggleTeamTaskSort('sub_task_title')} className="flex items-center hover:text-blue-600 transition-colors">
                    Sub-task<SortIcon active={teamTaskSortKey === 'sub_task_title'} dir={teamTaskSortDir} />
                  </button>
                  <button onClick={() => toggleTeamTaskSort('job_title')} className="flex items-center hover:text-blue-600 transition-colors">
                    Job<SortIcon active={teamTaskSortKey === 'job_title'} dir={teamTaskSortDir} />
                  </button>
                  <button onClick={() => toggleTeamTaskSort('due_date')} className="flex items-center justify-end hover:text-blue-600 transition-colors">
                    Due Date<SortIcon active={teamTaskSortKey === 'due_date'} dir={teamTaskSortDir} />
                  </button>
                  <button onClick={() => toggleTeamTaskSort('status')} className="flex items-center justify-end w-24 hover:text-blue-600 transition-colors">
                    Status<SortIcon active={teamTaskSortKey === 'status'} dir={teamTaskSortDir} />
                  </button>
                </div>
                {sortedTeamTaskRows.map((row) => {
                  const isOverdue = row.due_date && row.due_date < today && row.status !== 'Completed'
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        'grid grid-cols-1 sm:grid-cols-[1fr_160px_auto_auto] gap-2 sm:gap-4 items-center px-5 py-3.5',
                        isOverdue && 'bg-red-50/30',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{row.sub_task_title}</p>
                        {row.task_type && (
                          <span className="text-[10px] font-medium text-slate-400">{row.task_type}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate">{row.job_title}</p>
                      <p className={cn('text-xs font-medium text-right', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                        {row.due_date ? formatDate(row.due_date) : '—'}
                        {isOverdue && ' · Overdue'}
                      </p>
                      <div className="flex sm:justify-end">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', TEAM_TASK_STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-500')}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
