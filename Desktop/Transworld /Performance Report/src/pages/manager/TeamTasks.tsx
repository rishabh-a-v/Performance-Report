import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Avatar } from '@/components/ui/Avatar'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useBlockerStore } from '@/store/blockerStore'
import { PROFILES, reportees } from '@/lib/mockData'
import { formatRelative, cn } from '@/lib/utils'
import type { JobDirectionStatus, SpecialTaskStatus } from '@/types/database'
import {
  Compass, ListTodo, CheckCircle2, AlertTriangle, Search,
  ShieldAlert, UserX,
} from 'lucide-react'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { JobDirection, SpecialTask } from '@/types/database'

const JD_STATUS_LABEL: Record<JobDirectionStatus, string> = {
  draft: 'Draft', active: 'Active', submitted: 'Under Review',
  approved: 'Approved', rejected: 'Changes Needed', completed: 'Completed',
}

const JD_STATUS_STYLE: Record<JobDirectionStatus, string> = {
  draft:     'bg-slate-100 text-slate-500',
  active:    'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
}

const JD_BAR_COLOUR: Record<JobDirectionStatus, string> = {
  draft:     'bg-slate-300',
  active:    'bg-blue-500',
  submitted: 'bg-amber-400',
  approved:  'bg-emerald-500',
  rejected:  'bg-red-400',
  completed: 'bg-emerald-600',
}

const ST_STATUS_STYLE: Record<SpecialTaskStatus, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold:     'bg-amber-100 text-amber-700',
  completed:   'bg-emerald-100 text-emerald-700',
}

const ST_STATUS_LABEL: Record<SpecialTaskStatus, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
}

const ST_PRIORITY_STYLE: Record<string, string> = {
  low:      'bg-slate-100 text-slate-500',
  medium:   'bg-blue-100 text-blue-600',
  high:     'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
}

type JDFilter = 'all' | JobDirectionStatus
type STFilter = 'all' | SpecialTaskStatus

export function TeamTasks() {
  const { user } = useAuth()
  const allJDs = useJobDirectionStore((s) => s.directions)
  const allSTs = useSpecialTaskStore((s) => s.tasks)
  const { blockers, resolveBlocker } = useBlockerStore()

  const [activeTab, setActiveTab] = useState<'jd' | 'st'>('jd')
  const [search, setSearch] = useState('')
  const [jdFilter, setJdFilter] = useState<JDFilter>('all')
  const [stFilter, setStFilter] = useState<STFilter>('all')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null>(null)

  if (!user) return null

  const team = reportees(user.id)
  const teamIds = team.map((m) => m.id)

  const teamJDs = allJDs.filter((jd) => teamIds.includes(jd.employee_id))
  const teamSTs = allSTs.filter((st) => teamIds.includes(st.assigned_to))

  const today = new Date().toISOString().slice(0, 10)

  // KPIs
  const activeJDs  = teamJDs.filter((jd) => ['active', 'submitted', 'rejected'].includes(jd.status)).length
  const pendingSTs = teamSTs.filter((st) => st.status !== 'completed').length
  const completedTotal = teamJDs.filter((jd) => ['completed', 'approved'].includes(jd.status)).length
    + teamSTs.filter((st) => st.status === 'completed').length
  const atRisk = teamJDs.filter((jd) => jd.status === 'rejected').length
    + teamSTs.filter((st) => st.due_date && st.due_date < today && st.status !== 'completed').length

  const teamBlockers = blockers.filter((b) => teamIds.includes(b.employee_id) && !b.resolved_at)

  // Filtered lists
  const filteredJDs = teamJDs.filter((jd) => {
    const matchStatus = jdFilter === 'all' || jd.status === jdFilter
    const matchSearch = !search || jd.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const filteredSTs = teamSTs.filter((st) => {
    const matchStatus = stFilter === 'all' || st.status === stFilter
    const matchSearch = !search || st.title.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  function handleResolve(blockerId: string) {
    if (!user) return
    resolveBlocker(blockerId, user.id, resolveNotes)
    setResolvingId(null)
    setResolveNotes('')
  }

  const JD_FILTER_OPTIONS: { value: JDFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'submitted', label: 'Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Changes' },
    { value: 'completed', label: 'Done' },
  ]

  const ST_FILTER_OPTIONS: { value: STFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in_progress', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Done' },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Active Job Directions" value={activeJDs}       icon={Compass}       iconColor="text-blue-600" />
        <KPICard title="Pending Special Tasks" value={pendingSTs}      icon={ListTodo}      iconColor="text-slate-600" />
        <KPICard title="Completed (JD + ST)"   value={completedTotal}  icon={CheckCircle2}  iconColor="text-emerald-600" />
        <KPICard title="At Risk"               value={atRisk}          icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-slate-100 p-5 bg-slate-50/20">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Team Tasks</h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Job Directions and Special Tasks across your team</p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tab switcher */}
            <div className="flex rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setActiveTab('jd')}
                className={cn(
                  'rounded-md px-3 py-1 text-[10px] font-bold transition-colors flex items-center gap-1.5',
                  activeTab === 'jd' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <Compass size={10} />
                Job Directions
                <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold', activeTab === 'jd' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500')}>
                  {teamJDs.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('st')}
                className={cn(
                  'rounded-md px-3 py-1 text-[10px] font-bold transition-colors flex items-center gap-1.5',
                  activeTab === 'st' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                <ListTodo size={10} />
                Special Tasks
                <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-bold', activeTab === 'st' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500')}>
                  {teamSTs.length}
                </span>
              </button>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
              {(activeTab === 'jd' ? JD_FILTER_OPTIONS : ST_FILTER_OPTIONS).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => activeTab === 'jd' ? setJdFilter(opt.value as JDFilter) : setStFilter(opt.value as STFilter)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[10px] font-bold transition-colors',
                    (activeTab === 'jd' ? jdFilter : stFilter) === opt.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative sm:w-56">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* JD List */}
        {activeTab === 'jd' && (
          <div className="divide-y divide-slate-50">
            {filteredJDs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No job directions found.</div>
            ) : (
              filteredJDs.map((jd) => {
                const employee = PROFILES.find((p) => p.id === jd.employee_id)
                const isOverdue = jd.due_date && jd.due_date < today && !['completed', 'approved'].includes(jd.status)
                return (
                  <div
                    key={jd.id}
                    onClick={() => setSelectedDetail({ kind: 'jd', data: jd })}
                    className="px-5 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {employee && <Avatar name={employee.full_name} size="sm" className="shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{jd.title}</p>
                            {employee && (
                              <p className="text-[11px] text-slate-400 mt-0.5">{employee.full_name} · {employee.designation}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isOverdue && (
                              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Overdue</span>
                            )}
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', JD_STATUS_STYLE[jd.status])}>
                              {JD_STATUS_LABEL[jd.status]}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                            <div
                              className={cn('h-full rounded-full transition-all', JD_BAR_COLOUR[jd.status])}
                              style={{ width: `${Math.min(100, jd.progress_percentage)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 tabular-nums w-9 text-right">
                            {jd.progress_percentage.toFixed(0)}%
                          </span>
                          {jd.current_value != null && jd.target_value != null && (
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {jd.unit === 'INR'
                                ? `₹${jd.current_value.toLocaleString('en-IN')} / ₹${jd.target_value.toLocaleString('en-IN')}`
                                : `${jd.current_value} / ${jd.target_value} ${jd.unit ?? ''}`}
                            </span>
                          )}
                          {jd.due_date && (
                            <span className={cn('text-[10px] whitespace-nowrap', isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400')}>
                              {isOverdue ? 'Overdue · ' : 'Due '}
                              {new Date(jd.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>

                        {jd.review_notes && jd.status === 'rejected' && (
                          <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                            Manager note: {jd.review_notes}
                          </p>
                        )}
                        {jd.review_notes && jd.status === 'approved' && (
                          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700">
                            {jd.review_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ST List */}
        {activeTab === 'st' && (
          <div className="divide-y divide-slate-50">
            {filteredSTs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No special tasks found.</div>
            ) : (
              filteredSTs.map((st) => {
                const employee = PROFILES.find((p) => p.id === st.assigned_to)
                const isOverdue = st.due_date && st.due_date < today && st.status !== 'completed'
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedDetail({ kind: 'st', data: st })}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    {employee && <Avatar name={employee.full_name} size="sm" className="shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn(
                          'text-sm font-medium text-slate-800 truncate',
                          st.status === 'completed' && 'text-slate-400 line-through',
                        )}>
                          {st.title}
                        </p>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', ST_PRIORITY_STYLE[st.priority])}>
                          {st.priority}
                        </span>
                      </div>
                      {employee && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{employee.full_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {st.due_date && (
                        <span className={cn('text-[11px] font-medium', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                          {isOverdue ? 'Overdue · ' : ''}
                          {new Date(st.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ST_STATUS_STYLE[st.status])}>
                        {ST_STATUS_LABEL[st.status]}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400 font-medium bg-slate-50/30">
          {activeTab === 'jd'
            ? `Showing ${filteredJDs.length} of ${teamJDs.length} job directions`
            : `Showing ${filteredSTs.length} of ${teamSTs.length} special tasks`}
        </div>
      </div>

      {/* Team Blockers */}
      {teamBlockers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/20 shadow-sm rounded-2xl p-5">
          <div className="mb-3.5 flex items-center gap-2">
            <ShieldAlert size={15} className="text-orange-600" />
            <CardTitle className="text-orange-800 text-sm font-bold">Team Members Blocked</CardTitle>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
              {teamBlockers.length}
            </span>
          </div>
          <div className="space-y-3">
            {teamBlockers.map((b) => {
              const blocked = PROFILES.find((p) => p.id === b.employee_id)
              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-orange-200/60 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between shadow-sm"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <UserX size={13} className="text-orange-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">{blocked?.full_name ?? 'Team member'} is blocked</span>
                      <span className="text-[10px] text-slate-400">· {formatRelative(b.reported_at)}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-normal">{b.description}</p>
                  </div>
                  <div className="shrink-0">
                    {resolvingId === b.id ? (
                      <div className="flex flex-col gap-2 w-56">
                        <textarea
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          placeholder="Resolution notes…"
                          rows={2}
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-300"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolve(b.id)}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Confirm Resolved
                          </button>
                          <button
                            onClick={() => { setResolvingId(null); setResolveNotes('') }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(b.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
      {/* Task detail modal */}
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
