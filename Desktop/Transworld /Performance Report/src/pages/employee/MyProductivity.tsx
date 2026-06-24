import { useAuth } from '@/contexts/AuthContext'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { Card, CardTitle } from '@/components/ui/Card'
import { KPICard } from '@/components/ui/KPICard'
import { BLOCKERS, PROFILES } from '@/lib/mockData'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Compass, ListTodo, AlertTriangle, Target, CheckCircle2, Clock } from 'lucide-react'
import type { JobDirectionStatus } from '@/types/database'

const JD_STATUS_LABEL: Record<JobDirectionStatus, string> = {
  draft:     'Draft',
  active:    'Active',
  submitted: 'Under Review',
  approved:  'Approved',
  rejected:  'Changes Needed',
  completed: 'Completed',
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

const ST_STATUS_STYLE: Record<string, string> = {
  pending:     'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  on_hold:     'bg-amber-100 text-amber-700',
  completed:   'bg-emerald-100 text-emerald-700',
}

const ST_STATUS_LABEL: Record<string, string> = {
  pending:     'Pending',
  in_progress: 'In Progress',
  on_hold:     'On Hold',
  completed:   'Completed',
}

export function MyProductivity() {
  const { user } = useAuth()
  const allJDs = useJobDirectionStore((s) => s.directions)
  const allSTs = useSpecialTaskStore((s) => s.tasks)

  if (!user) return null

  const myJDs = allJDs.filter((jd) => jd.employee_id === user.id)
  const mySTs = allSTs.filter((st) => st.assigned_to === user.id)
  const myBlockers = BLOCKERS.filter((b) => b.employee_id === user.id)

  const activeJDs    = myJDs.filter((jd) => ['active', 'rejected'].includes(jd.status))
  const completedJDs = myJDs.filter((jd) => jd.status === 'completed')
  const avgProgress  = activeJDs.length
    ? Math.round(activeJDs.reduce((s, jd) => s + jd.progress_percentage, 0) / activeJDs.length)
    : 0

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const completedSTs = mySTs.filter((st) => st.status === 'completed')
  const completedThisWeek = completedSTs.filter((st) => st.updated_at >= weekAgo)
  const overdueSTs = mySTs.filter(
    (st) => st.due_date && st.due_date < today && st.status !== 'completed',
  )
  const stCompletionRate = mySTs.length
    ? Math.round((completedSTs.length / mySTs.length) * 100)
    : 0

  const managerName = PROFILES.find((p) => p.id === user.manager_id)?.full_name ?? 'Manager'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard
          title="Active Job Directions"
          value={activeJDs.length}
          icon={Compass}
          iconColor="text-blue-600"
        />
        <KPICard
          title="Avg JD Progress"
          value={`${avgProgress}%`}
          icon={Target}
          delta={5}
          iconColor="text-violet-600"
        />
        <KPICard
          title="Tasks Done This Week"
          value={completedThisWeek.length}
          icon={CheckCircle2}
          delta={completedThisWeek.length > 0 ? 1 : 0}
          iconColor="text-emerald-600"
        />
        <KPICard
          title="Task Completion Rate"
          value={`${stCompletionRate}%`}
          icon={ListTodo}
          iconColor="text-slate-600"
        />
      </div>

      {/* Job Directions */}
      <Card padding={false}>
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <CardTitle>Job Directions</CardTitle>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
            {myJDs.length} total
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {myJDs.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No job directions assigned.</p>
          ) : (
            myJDs.map((jd) => (
              <div key={jd.id} className="px-4 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{jd.title}</p>
                    {jd.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{jd.description}</p>
                    )}
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    JD_STATUS_STYLE[jd.status],
                  )}>
                    {JD_STATUS_LABEL[jd.status]}
                  </span>
                </div>
                {jd.progress_type !== 'milestone' && (
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
                      <span className="text-[10px] text-slate-400">
                        {jd.unit === 'INR'
                          ? `₹${jd.current_value.toLocaleString('en-IN')} / ₹${jd.target_value.toLocaleString('en-IN')}`
                          : `${jd.current_value} / ${jd.target_value} ${jd.unit ?? ''}`}
                      </span>
                    )}
                  </div>
                )}
                {jd.progress_type === 'milestone' && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', JD_BAR_COLOUR[jd.status])}
                        style={{ width: `${jd.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums w-9 text-right">
                      {jd.progress_percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400">Milestones</span>
                  </div>
                )}
                {jd.review_notes && jd.status === 'rejected' && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] text-red-600">
                    {jd.review_notes}
                  </p>
                )}
                {jd.review_notes && jd.status === 'approved' && (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-700">
                    {jd.review_notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Special Tasks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Overdue / Active */}
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <CardTitle>Active Special Tasks</CardTitle>
            {overdueSTs.length > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                {overdueSTs.length} overdue
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-50">
            {mySTs.filter((st) => st.status !== 'completed').length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">All caught up!</p>
            ) : (
              mySTs
                .filter((st) => st.status !== 'completed')
                .map((st) => {
                  const isOverdue = st.due_date && st.due_date < today
                  return (
                    <div key={st.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/60">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{st.title}</p>
                        {st.due_date && (
                          <p className={cn('text-[11px] mt-0.5', isOverdue ? 'text-red-500 font-semibold' : 'text-slate-400')}>
                            {isOverdue ? 'Overdue · ' : 'Due '}
                            {new Date(st.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', ST_STATUS_STYLE[st.status])}>
                        {ST_STATUS_LABEL[st.status]}
                      </span>
                    </div>
                  )
                })
            )}
          </div>
        </Card>

        {/* Recently completed STs */}
        <Card padding={false}>
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <CardTitle>Completed Special Tasks</CardTitle>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {completedSTs.length} total
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {completedSTs.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">None completed yet.</p>
            ) : (
              completedSTs.slice(0, 5).map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                    <p className="text-sm text-slate-600 line-through truncate">{st.title}</p>
                  </div>
                  <p className="shrink-0 text-[11px] text-slate-400">{formatRelative(st.updated_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

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
                  <span className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    b.resolved_at ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
                  )}>
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
