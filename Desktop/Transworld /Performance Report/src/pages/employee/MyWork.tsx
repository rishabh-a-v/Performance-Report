import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useBlockerStore } from '@/store/blockerStore'
import { PROFILES } from '@/lib/mockData'
import { formatRelative, cn } from '@/lib/utils'
import type { JobDirectionStatus, SpecialTaskStatus } from '@/types/database'
import {
  Compass, ListTodo, CheckCircle2, AlertTriangle,
  ShieldAlert, UserX, Clock,
} from 'lucide-react'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import type { JobDirection, SpecialTask } from '@/types/database'

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

export function MyWork() {
  const { user } = useAuth()
  const allJDs    = useJobDirectionStore((s) => s.directions)
  const allSTs    = useSpecialTaskStore((s) => s.tasks)
  const setSTStatus = useSpecialTaskStore((s) => s.setStatus)
  const { blockers } = useBlockerStore()

  const [activeTab, setActiveTab] = useState<'jd' | 'st'>('jd')
  const [selectedDetail, setSelectedDetail] = useState<{ kind: 'jd'; data: JobDirection } | { kind: 'st'; data: SpecialTask } | null>(null)

  if (!user) return null

  const today = new Date().toISOString().slice(0, 10)

  const myJDs = allJDs.filter((jd) => jd.employee_id === user.id)
  const mySTs = allSTs.filter((st) => st.assigned_to === user.id)

  const activeJDs    = myJDs.filter((jd) => ['active', 'rejected'].includes(jd.status))
  const pendingSTs   = mySTs.filter((st) => st.status !== 'completed')
  const completedJDs = myJDs.filter((jd) => ['completed', 'approved'].includes(jd.status)).length
  const completedSTs = mySTs.filter((st) => st.status === 'completed').length
  const overdueSTs   = mySTs.filter((st) => st.due_date && st.due_date < today && st.status !== 'completed').length

  const causingBlockers = blockers.filter((b) => b.blocked_by_user_id === user.id && !b.resolved_at)

  function toggleSTDone(stId: string, currentStatus: SpecialTaskStatus) {
    setSTStatus(stId, currentStatus === 'completed' ? 'in_progress' : 'completed')
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Active JDs"    value={activeJDs.length}            icon={Compass}       iconColor="text-blue-600" />
        <KPICard title="Pending Tasks" value={pendingSTs.length}           icon={ListTodo}      iconColor="text-slate-600" />
        <KPICard title="Completed"     value={completedJDs + completedSTs} icon={CheckCircle2}  iconColor="text-emerald-600" />
        <KPICard title="Overdue"       value={overdueSTs}                  icon={AlertTriangle} iconColor="text-red-500" invertDelta />
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-100 p-5 bg-slate-50/20">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">My Work</h2>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">Your Job Directions and Special Tasks</p>
        </div>

        {/* Tab bar */}
        <div className="border-b border-slate-100 px-4 py-3 flex items-center gap-2 bg-white">
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
                {myJDs.length}
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
                {mySTs.length}
              </span>
            </button>
          </div>
        </div>

        {/* JD list */}
        {activeTab === 'jd' && (
          <div className="divide-y divide-slate-50">
            {myJDs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No job directions assigned.</div>
            ) : (
              myJDs.map((jd) => {
                const isOverdue = jd.due_date && jd.due_date < today && !['completed', 'approved'].includes(jd.status)
                return (
                  <div
                    key={jd.id}
                    onClick={() => setSelectedDetail({ kind: 'jd', data: jd })}
                    className="px-5 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{jd.title}</p>
                        {jd.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{jd.description}</p>
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
                )
              })
            )}
          </div>
        )}

        {/* ST list */}
        {activeTab === 'st' && (
          <div className="divide-y divide-slate-50">
            {mySTs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">No special tasks assigned.</div>
            ) : (
              mySTs.map((st) => {
                const isOverdue = st.due_date && st.due_date < today && st.status !== 'completed'
                const isDone    = st.status === 'completed'
                return (
                  <div
                    key={st.id}
                    onClick={() => setSelectedDetail({ kind: 'st', data: st })}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSTDone(st.id, st.status) }}
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                        isDone
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white hover:border-emerald-400',
                      )}
                    >
                      {isDone && (
                        <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={cn('text-sm font-medium text-slate-800', isDone && 'text-slate-400 line-through')}>
                          {st.title}
                        </p>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', ST_PRIORITY_STYLE[st.priority])}>
                          {st.priority}
                        </span>
                      </div>
                      {st.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{st.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {st.due_date && (
                        <span className={cn('text-[11px] font-medium flex items-center gap-1', isOverdue ? 'text-red-500' : 'text-slate-400')}>
                          <Clock size={10} />
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
            ? `${myJDs.length} job directions · ${activeJDs.length} active`
            : `${mySTs.length} tasks · ${pendingSTs.length} pending`}
        </div>
      </div>

      {/* Blockers I'm causing */}
      {causingBlockers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/20 shadow-sm rounded-2xl p-5">
          <div className="mb-3.5 flex items-center gap-2">
            <ShieldAlert size={15} className="text-orange-600" />
            <CardTitle className="text-orange-800 text-sm font-bold">You're Blocking Someone</CardTitle>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-700">
              {causingBlockers.length}
            </span>
          </div>
          <div className="space-y-3">
            {causingBlockers.map((b) => {
              const blocked = PROFILES.find((p) => p.id === b.employee_id)
              return (
                <div key={b.id} className="rounded-xl border border-orange-200/60 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <UserX size={13} className="text-orange-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">
                      {blocked?.full_name ?? 'Someone'} is blocked
                    </span>
                    <span className="text-[10px] text-slate-400">· {formatRelative(b.reported_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">{b.description}</p>
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
