import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { Avatar } from '@/components/ui/Avatar'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { PROFILES, DEPARTMENTS, reportees } from '@/lib/mockData'
import { formatCurrency } from '@/lib/kpiEngine'
import { cn } from '@/lib/utils'
import type { JobDirectionStatus } from '@/types/database'
import {
  TrendingUp, AlertTriangle, CheckCircle2,
  ArrowUpDown, Filter, Compass,
} from 'lucide-react'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { JobDirection } from '@/types/database'

type SortKey = 'progress' | 'due' | 'employee'
type SortDir = 'asc' | 'desc'

const JD_STATUS_STYLE: Record<JobDirectionStatus, string> = {
  draft:     'bg-slate-100 text-slate-500',
  active:    'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  rejected:  'bg-red-100 text-red-700',
  completed: 'bg-slate-100 text-slate-600',
}

const JD_STATUS_LABEL: Record<JobDirectionStatus, string> = {
  draft:     'Draft',
  active:    'Active',
  submitted: 'Under Review',
  approved:  'Approved',
  rejected:  'Changes Needed',
  completed: 'Completed',
}

const JD_BAR_COLOUR: Record<JobDirectionStatus, string> = {
  draft:     'bg-slate-300',
  active:    'bg-blue-500',
  submitted: 'bg-amber-400',
  approved:  'bg-emerald-500',
  rejected:  'bg-red-400',
  completed: 'bg-emerald-600',
}

export function TeamProductivity() {
  const { user } = useAuth()
  const allJDs = useJobDirectionStore((s) => s.directions)

  const [deptFilter, setDeptFilter] = useState('all')
  const [sortKey, setSortKey]       = useState<SortKey>('progress')
  const [sortDir, setSortDir]       = useState<SortDir>('asc')
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'jd'; data: JobDirection } | null>(null)

  if (!user) return null

  const canSeeAll = user.role === 'director' || user.role === 'managing_director'
  const team = reportees(user.id)
  const teamIds = team.map((m) => m.id)

  const today = new Date().toISOString().slice(0, 10)

  const activeStatuses: JobDirectionStatus[] = ['active', 'submitted', 'approved', 'rejected']
  const teamJDs = allJDs.filter((jd) =>
    activeStatuses.includes(jd.status) &&
    (canSeeAll || teamIds.includes(jd.employee_id))
  )

  const deptFiltered = deptFilter === 'all'
    ? teamJDs
    : teamJDs.filter((jd) => {
        const emp = PROFILES.find((p) => p.id === jd.employee_id)
        return emp?.department_id === deptFilter
      })

  const rows = useMemo(() => {
    return deptFiltered.map((jd) => {
      const assignee = PROFILES.find((p) => p.id === jd.employee_id)
      const isOverdue = jd.due_date ? jd.due_date < today : false
      const dueMs     = jd.due_date ? new Date(jd.due_date).getTime() : Infinity
      return { jd, assignee, isOverdue, dueMs }
    })
  }, [deptFiltered, today])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let diff = 0
      if (sortKey === 'progress') diff = a.jd.progress_percentage - b.jd.progress_percentage
      if (sortKey === 'due')      diff = a.dueMs - b.dueMs
      if (sortKey === 'employee') diff = (a.assignee?.full_name ?? '').localeCompare(b.assignee?.full_name ?? '')
      return sortDir === 'asc' ? diff : -diff
    })
  }, [rows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const avgProgress = rows.length
    ? Math.round(rows.reduce((s, r) => s + r.jd.progress_percentage, 0) / rows.length)
    : 0
  const onTrack = rows.filter((r) => !r.isOverdue && r.jd.status !== 'rejected').length
  const atRisk  = rows.filter((r) => r.isOverdue || r.jd.status === 'rejected').length

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
      <div>
        <h2 className="text-lg font-bold text-slate-900">Team Productivity</h2>
        <p className="text-xs text-slate-400 mt-0.5">Job Direction progress across all active team members</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Active Job Directions" value={teamJDs.length}    icon={Compass}       iconColor="text-brand-600" />
        <KPICard title="Avg Progress"          value={`${avgProgress}%`} icon={TrendingUp}    iconColor="text-emerald-600" />
        <KPICard title="On Track"              value={onTrack}           icon={CheckCircle2}  iconColor="text-emerald-600" />
        <KPICard title="At Risk"               value={atRisk}            icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      {/* Dept filter */}
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
                <th className="px-4 py-3 text-left"><SortButton k="employee" label="Employee" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Job Direction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Value</th>
                <th className="px-4 py-3 text-left"><SortButton k="progress" label="Progress" /></th>
                <th className="px-4 py-3 text-left"><SortButton k="due" label="Due" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                    No active job directions for this filter.
                  </td>
                </tr>
              ) : (
                sorted.map(({ jd, assignee, isOverdue }) => (
                  <tr 
                    key={jd.id} 
                    onClick={() => setSelectedDetail({ kind: 'jd', data: jd })}
                    className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
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
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{jd.title}</p>
                      {jd.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{jd.description}</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded capitalize">
                        {jd.progress_type}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {jd.progress_type === 'milestone'
                        ? `${jd.progress_percentage.toFixed(0)}% done`
                        : jd.current_value != null && jd.target_value != null
                          ? jd.unit === 'INR'
                            ? `${formatCurrency(jd.current_value, 'INR')} / ${formatCurrency(jd.target_value, 'INR')}`
                            : `${jd.current_value} / ${jd.target_value} ${jd.unit ?? ''}`
                          : '—'}
                    </td>

                    <td className="px-4 py-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', JD_BAR_COLOUR[jd.status])}
                            style={{ width: `${Math.min(100, jd.progress_percentage)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 tabular-nums w-9 text-right">
                          {jd.progress_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {jd.due_date ? (
                        <span className={cn('text-xs font-medium', isOverdue ? 'text-red-600' : 'text-slate-500')}>
                          {new Date(jd.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          {isOverdue && <span className="ml-1 text-[10px] text-red-500">overdue</span>}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', JD_STATUS_STYLE[jd.status])}>
                        {JD_STATUS_LABEL[jd.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
            {sorted.length} active job directions · {onTrack} on track · {atRisk} at risk
          </div>
        )}
      </Card>
      <TaskDetailModal item={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  )
}
