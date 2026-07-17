import { useMemo, useState } from 'react'
import { X, Briefcase, CheckSquare, Users, Mail, Phone, MapPin, Network } from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useTeamJobStore } from '@/store/teamJobStore'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { cn, formatDate, todayLocalISO } from '@/lib/utils'
import type { JobDirection, Profile, SpecialTask, TeamJob, TeamJobTask } from '@/types/database'

function InfoCell({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground truncate">
        {Icon && <Icon size={13} className="shrink-0 text-muted-foreground" />}
        <span className="truncate">{value || '—'}</span>
      </p>
    </div>
  )
}

function SectionHeading({ icon: Icon, title, count }: { icon: React.ElementType; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-muted-foreground" />
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground tabular-nums">{count}</span>
    </div>
  )
}

/**
 * Slide-over showing one employee's profile plus everything on their plate:
 * job directions, special tasks, and team-job sub-tasks. Rows open the same
 * TaskDetailModal used across the app.
 */
export function EmployeeDetailPanel({ employee, onClose }: { employee: Profile; onClose: () => void }) {
  const profiles    = useProfileStore((s) => s.profiles)
  const departments = useProfileStore((s) => s.departments)
  const directions  = useJobDirectionStore((s) => s.directions)
  const allTasks    = useSpecialTaskStore((s) => s.tasks)
  const teamJobs    = useTeamJobStore((s) => s.jobs)
  const today = todayLocalISO()

  const [detail, setDetail] = useState<
    | { kind: 'jd'; data: JobDirection }
    | { kind: 'st'; data: SpecialTask }
    | { kind: 'tjt'; data: TeamJobTask; job: TeamJob }
    | null
  >(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'directions' | 'tasks'>('directions')

  const manager    = profiles.find((p) => p.id === employee.manager_id)
  const department = departments.find((d) => d.id === employee.department_id)

  const empJDs = useMemo(
    () => directions.filter((d) => d.employee_id === employee.id),
    [directions, employee.id],
  )

  const empTasks = useMemo(
    () => allTasks
      .filter((t) => t.assignees?.some((a) => a.employee_id === employee.id))
      .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')),
    [allTasks, employee.id],
  )

  const empSubTasks = useMemo(() => {
    const result: Array<{ task: TeamJobTask; job: TeamJob }> = []
    for (const job of teamJobs) {
      for (const task of (job.tasks ?? [])) {
        if (task.assignee_id === employee.id) result.push({ task, job })
      }
    }
    return result.sort((a, b) => (a.task.due_date ?? '9999').localeCompare(b.task.due_date ?? '9999'))
  }, [teamJobs, employee.id])

  return (
    <>
      {/* Full-screen Panel */}
      <div className="fixed inset-0 z-50 flex w-full h-full flex-col bg-background">
        {/* Header */}
        <div
          className="flex items-start justify-between border-b border-border bg-card px-6 py-5"
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={employee.full_name} size="lg" className="shadow-sm" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground leading-tight truncate">{employee.full_name}</h2>
              <p className="text-sm text-muted-foreground capitalize font-medium">
                {(employee.role ?? '').replace('_', ' ')}
                {employee.employee_code && <span className="text-muted-foreground/70"> · {employee.employee_code}</span>}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-card px-6">
          {(['directions', 'tasks', 'profile'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'border-b-2 py-3 px-4 text-xs sm:text-sm font-semibold capitalize transition-all -mb-px',
                activeTab === t
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t === 'profile'
                ? 'Profile Details'
                : t === 'directions'
                  ? `Job Directions (${empJDs.length})`
                  : `Tasks (${empTasks.length + empSubTasks.length})`}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Tab Content: Profile Details */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
              {/* Profile Main Card */}
              <div className="rounded-xl border border-border bg-card shadow-sm p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InfoCell icon={Mail}    label="Email"      value={employee.email} />
                  <InfoCell icon={Phone}   label="Phone"      value={employee.phone_no} />
                  <InfoCell icon={MapPin}  label="Branch"     value={employee.branch} />
                  <InfoCell icon={Network} label="Department" value={department?.name} />
                  <InfoCell icon={Users}   label="Reports To" value={manager?.full_name} />
                  <InfoCell label="Employee Code" value={employee.employee_code} />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Job Directions */}
          {activeTab === 'directions' && (
            <div className="p-6 space-y-4 max-w-4xl mx-auto w-full">
              {empJDs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground bg-card">
                  No job directions assigned.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {empJDs.map((jd) => (
                    <button
                      key={jd.id}
                      onClick={() => setDetail({ kind: 'jd', data: jd })}
                      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn('flex-1 text-sm font-semibold leading-snug text-slate-800', jd.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
                          {jd.work_details || '—'}
                        </p>
                        <StatusBadge status={jd.status} className="shrink-0 whitespace-nowrap text-[10px] uppercase font-bold" />
                      </div>
                      {jd.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{jd.description}</p>
                      )}
                      
                      {jd.daily_target > 0 || jd.weekly_target > 0 || jd.monthly_target > 0 ? (
                        <div className="mt-3.5 grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-3">
                          {jd.daily_target > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Daily</span>
                              <span className="text-xs font-bold text-slate-700 mt-0.5">{jd.daily_completed} / {jd.daily_target}</span>
                            </div>
                          )}
                          {jd.weekly_target > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Weekly</span>
                              <span className="text-xs font-bold text-slate-700 mt-0.5">{jd.weekly_completed} / {jd.weekly_target}</span>
                            </div>
                          )}
                          {jd.monthly_target > 0 && (
                            <div className="flex flex-col">
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Monthly</span>
                              <span className="text-xs font-bold text-slate-700 mt-0.5">{jd.monthly_completed} / {jd.monthly_target}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-3 border-t border-slate-100 pt-2">No numeric targets set</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Tasks */}
          {activeTab === 'tasks' && (
            <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
              {/* Special Tasks Section */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Special Tasks</h3>
                  <span className="rounded-full bg-card border border-border px-2 py-0.5 text-xs font-bold text-slate-600">{empTasks.length}</span>
                </div>
                {empTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-card">
                    No special tasks assigned.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {empTasks.map((task) => {
                      const overdue = task.due_date && task.due_date < today && task.status !== 'Completed' && task.status !== 'In review'
                      return (
                        <button
                          key={task.id}
                          onClick={() => setDetail({ kind: 'st', data: task })}
                          className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.99] flex flex-col justify-between min-h-[90px]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={cn('flex-1 text-sm font-semibold leading-snug text-slate-800', task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
                              {task.task_name}
                            </p>
                            <StatusBadge status={task.status} className="shrink-0 whitespace-nowrap text-[10px] uppercase font-bold" />
                          </div>
                          {task.due_date && (
                            <p className={cn('mt-2 text-xs font-medium', overdue ? 'text-red-500 font-semibold' : 'text-slate-400')}>
                              Due {formatDate(task.due_date)}{overdue ? ' · Overdue' : ''}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Team Job Sub-tasks Section */}
              <div className="space-y-3.5 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Team Job Sub-tasks</h3>
                  <span className="rounded-full bg-card border border-border px-2 py-0.5 text-xs font-bold text-slate-600">{empSubTasks.length}</span>
                </div>
                {empSubTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-card">
                    No team job sub-tasks assigned.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {empSubTasks.map(({ task, job }) => {
                      const overdue = task.due_date && task.due_date < today && task.status !== 'Completed'
                      return (
                        <button
                          key={task.id}
                          onClick={() => setDetail({ kind: 'tjt', data: task, job })}
                          className="w-full rounded-xl border border-border bg-card p-4 text-left transition-all hover:shadow-md hover:border-slate-300 active:scale-[0.99] flex flex-col justify-between min-h-[100px]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className={cn('flex-1 text-sm font-semibold leading-snug text-slate-800', task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-800')}>
                              {task.title}
                            </p>
                            <StatusBadge status={task.status} className="shrink-0 whitespace-nowrap text-[10px] uppercase font-bold" />
                          </div>
                          <div className="mt-3 flex flex-col gap-1">
                            <span className="self-start rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary truncate max-w-full">
                              ↳ {job.title}
                            </span>
                            {task.due_date && (
                              <span className={cn('text-xs font-medium mt-1', overdue ? 'text-red-500 font-semibold' : 'text-slate-400')}>
                                Due {formatDate(task.due_date)}{overdue ? ' · Overdue' : ''}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item detail modal (shared layout across the app) */}
      <TaskDetailModal item={detail} onClose={() => setDetail(null)} />
    </>
  )
}
