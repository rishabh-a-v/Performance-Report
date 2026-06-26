import { useAuth } from '@/contexts/AuthContext'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useProfileStore } from '@/store/profileStore'
import { usePermissionStore } from '@/store/permissionStore'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, CheckSquare, AlertCircle, TrendingUp,
  Users, Clock, ArrowRight, Plus, Bell,
} from 'lucide-react'
import type { JobDirection, SpecialTask } from '@/types/database'

const ROLE_DISPLAY: Record<string, string> = {
  executive: 'Executive',
  manager: 'Manager',
  director: 'Director',
  managing_director: 'Managing Director',
  executive_assistant: 'Executive Assistant',
  hr: 'HR',
}

const JD_STATUS_PILL: Record<string, string> = {
  draft:     'bg-slate-100 text-slate-500',
  active:    'bg-blue-100 text-blue-700',
  submitted: 'bg-amber-100 text-amber-700',
  approved:  'bg-emerald-100 text-emerald-700',
  completed: 'bg-teal-100 text-teal-700',
  rejected:  'bg-red-100 text-red-600',
}

const TASK_STATUS_PILL: Record<string, string> = {
  'Yet to start': 'bg-slate-100 text-slate-500',
  'In progress':  'bg-blue-100 text-blue-700',
  Completed:      'bg-emerald-100 text-emerald-700',
  'In review':    'bg-purple-100 text-purple-700',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({
  label, value, sub, icon: Icon, color, bg, onClick,
}: {
  label: string
  value: number | string
  sub?: string
  icon: React.ElementType
  color: string
  bg: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-white border border-slate-100 shadow-sm p-4 sm:p-5 text-left transition-all w-full group',
        onClick ? 'hover:shadow-md hover:border-slate-200 cursor-pointer' : 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', bg)}>
          <Icon size={17} className={color} />
        </div>
        {onClick && (
          <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1" />
        )}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-tight mb-1">{label}</p>
      <p className={cn('text-3xl font-bold tabular-nums', color)}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </button>
  )
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">{title}</h2>
      {action && onAction && (
        <button onClick={onAction} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          {action} <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}

function JDRow({ jd, profiles }: { jd: JobDirection; profiles: ReturnType<typeof useProfileStore['getState']>['profiles'] }) {
  const emp = profiles.find((p) => p.id === jd.employee_id)
  const pillClass = JD_STATUS_PILL[jd.status] ?? 'bg-slate-100 text-slate-500'

  const pct = (() => {
    if (jd.daily_target > 0) return Math.min(100, Math.round((jd.daily_completed / jd.daily_target) * 100))
    if (jd.weekly_target > 0) return Math.min(100, Math.round((jd.weekly_completed / jd.weekly_target) * 100))
    if (jd.monthly_target > 0) return Math.min(100, Math.round((jd.monthly_completed / jd.monthly_target) * 100))
    return null
  })()

  return (
    <div className="flex items-center gap-3 py-2.5 px-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">
          {jd.work_details ?? '—'}
        </p>
        {emp && <p className="text-xs text-slate-400 mt-0.5">{emp.full_name}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {pct !== null && (
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn('h-full rounded-full', pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 tabular-nums w-7">{pct}%</span>
          </div>
        )}
        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', pillClass)}>
          {jd.status}
        </span>
      </div>
    </div>
  )
}

function TaskRow({ task, today, profiles }: { task: SpecialTask; today: string; profiles: ReturnType<typeof useProfileStore['getState']>['profiles'] }) {
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'Completed'
  const assigner = profiles.find((p) => p.id === task.assigned_by)
  const pillClass = TASK_STATUS_PILL[task.status] ?? 'bg-slate-100 text-slate-500'

  return (
    <div className="flex items-center gap-3 py-2.5 px-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{task.task_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {assigner && <p className="text-xs text-slate-400">by {assigner.full_name}</p>}
          {task.due_date && (
            <p className={cn('text-xs font-medium', isOverdue ? 'text-red-500' : 'text-slate-400')}>
              {isOverdue ? '⚠ Overdue' : `Due ${task.due_date}`}
            </p>
          )}
        </div>
      </div>
      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0', pillClass)}>
        {task.status}
      </span>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-4 py-6 text-center text-xs text-slate-400">{message}</div>
  )
}

export function Overview() {
  const { user, role } = useAuth()
  const navigate   = useNavigate()
  const directions = useJobDirectionStore((s) => s.directions)
  const tasks      = useSpecialTaskStore((s) => s.tasks)
  const profiles   = useProfileStore((s) => s.profiles)
  const canCreateJD    = usePermissionStore((s) => s.permissions?.can_create_job_directions ?? false)
  const canCreateTasks = usePermissionStore((s) => s.permissions?.can_create_tasks ?? false)

  if (!user || !role) return null

  const today     = new Date().toISOString().slice(0, 10)
  const thisMonth = today.slice(0, 7)

  const ROLE_LEVEL: Record<string, number> = {
    executive: 0, executive_assistant: 3, hr: 3, manager: 1, director: 2, managing_director: 3,
  }
  const roleLevel  = ROLE_LEVEL[role] ?? 0
  const isManager  = roleLevel >= 1
  const isDirector = roleLevel >= 2

  // ── Personal stats ──────────────────────────────────────────────────────────
  const myJDs   = directions.filter((d) => d.employee_id === user.id)
  const myTasks = tasks.filter((t) => t.assignees?.some((a) => a.employee_id === user.id))

  // "Active" matches the JD page's Active KPI (status === 'active' only)
  const myActiveJDs   = myJDs.filter((d) => d.status === 'active')
  // "Active" tasks matches SpecialTasks: not Completed
  const myActiveTasks = myTasks.filter((t) => t.status !== 'Completed')

  // Overdue: same exclusions as SpecialTasks
  const myOverdue = myTasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'Completed').length

  // Completed
  const myCompleted = [
    ...myJDs.filter((d) => d.status === 'completed'),
    ...myTasks.filter((t) => t.status === 'Completed' && t.created_at?.startsWith(thisMonth)),
  ].length

  // Recent items (up to 4)
  const recentJDs   = myActiveJDs.slice(0, 4)
  const upcomingTasks = [...myActiveTasks]
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date.localeCompare(b.due_date)
    })
    .slice(0, 4)

  // ── Manager stats ───────────────────────────────────────────────────────────
  const directReportIds = profiles.filter((p) => p.manager_id === user.id).map((p) => p.id)
  const pendingApprovals = directions.filter((d) => d.manager_id === user.id && d.status === 'submitted').length

  // Active team JDs: matches JD page teamDirections activeTeam = status !== 'completed'
  const teamActiveJDs   = directions.filter((d) => directReportIds.includes(d.employee_id) && d.status !== 'completed').length
  // Active team tasks / overdue: matches SpecialTasks activeTeam = !== Completed
  const teamActiveTasks = tasks.filter((t) => t.assignees?.some((a) => directReportIds.includes(a.employee_id)) && t.status !== 'Completed').length
  const teamOverdue     = tasks.filter((t) => directReportIds.some((id) => t.assignees?.some((a) => a.employee_id === id)) && t.due_date && t.due_date < today && t.status !== 'Completed').length

  // Recent pending JDs awaiting my approval
  const pendingJDs = directions
    .filter((d) => d.manager_id === user.id && d.status === 'submitted')
    .slice(0, 3)

  // ── Org stats (directors+) ──────────────────────────────────────────────────
  // Active org JDs: matches JD page definition (status !== 'completed')
  const orgActiveJDs   = directions.filter((d) => d.status !== 'completed').length
  // Active/overdue org tasks: matches SpecialTasks
  const orgActiveTasks = tasks.filter((t) => t.status !== 'Completed').length
  const orgOverdue     = tasks.filter((t) => t.due_date && t.due_date < today && t.status !== 'Completed').length
  const orgEmployees   = profiles.length

  const dateLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 mb-0.5">{dateLabel}</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user.full_name.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {ROLE_DISPLAY[role] ?? role}
            {user.branch ? <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{user.branch}</span> : null}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {canCreateJD && (
            <button
              onClick={() => navigate('/job-directions')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus size={13} /> Job Direction
            </button>
          )}
          {canCreateTasks && (
            <button
              onClick={() => navigate('/special-tasks')}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={13} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* ── My Work stats ─────────────────────────────────────────────────── */}
      <div>
        <SectionHeading title="My Work" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Active Job Directions"
            value={myActiveJDs.length}
            icon={Briefcase}
            color="text-blue-600"
            bg="bg-blue-50"
            onClick={() => navigate('/job-directions')}
          />
          <StatCard
            label="Active Tasks"
            value={myActiveTasks.length}
            icon={CheckSquare}
            color="text-indigo-600"
            bg="bg-indigo-50"
            onClick={() => navigate('/special-tasks')}
          />
          <StatCard
            label="Overdue Tasks"
            value={myOverdue}
            sub={myOverdue > 0 ? 'Needs attention' : 'All on track'}
            icon={AlertCircle}
            color={myOverdue > 0 ? 'text-red-600' : 'text-emerald-600'}
            bg={myOverdue > 0 ? 'bg-red-50' : 'bg-emerald-50'}
            onClick={() => navigate('/special-tasks')}
          />
          <StatCard
            label="Completed This Month"
            value={myCompleted}
            icon={TrendingUp}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>
      </div>

      {/* ── My activity feed (two columns on desktop) ──────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* My Job Directions */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Briefcase size={14} className="text-blue-500" />
              <span className="text-sm font-semibold text-slate-700">My Job Directions</span>
              <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">{myActiveJDs.length}</span>
            </div>
            <button onClick={() => navigate('/job-directions')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentJDs.length === 0
              ? <EmptyState message="No active job directions" />
              : recentJDs.map((jd) => <JDRow key={jd.id} jd={jd} profiles={profiles} />)
            }
          </div>
        </div>

        {/* My Tasks */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckSquare size={14} className="text-indigo-500" />
              <span className="text-sm font-semibold text-slate-700">My Tasks</span>
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600">{myActiveTasks.length}</span>
              {myOverdue > 0 && (
                <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                  <AlertCircle size={9} /> {myOverdue} overdue
                </span>
              )}
            </div>
            <button onClick={() => navigate('/special-tasks')} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5">
              View all <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingTasks.length === 0
              ? <EmptyState message="No active tasks" />
              : upcomingTasks.map((t) => <TaskRow key={t.id} task={t} today={today} profiles={profiles} />)
            }
          </div>
        </div>
      </div>

      {/* ── Team (managers+) ───────────────────────────────────────────────── */}
      {isManager && (
        <div>
          <SectionHeading title="My Team" action="Approvals" onAction={() => navigate('/approval-center')} />
          <div className="grid gap-3 sm:grid-cols-4 mb-4">
            <StatCard
              label="Active Directions"
              value={teamActiveJDs}
              icon={Briefcase}
              color="text-blue-600"
              bg="bg-blue-50"
              onClick={() => navigate('/job-directions', { state: { view: 'team' } })}
            />
            <StatCard
              label="Active Tasks"
              value={teamActiveTasks}
              icon={CheckSquare}
              color="text-indigo-600"
              bg="bg-indigo-50"
              onClick={() => navigate('/special-tasks', { state: { view: 'team' } })}
            />
            <StatCard
              label="Team Overdue"
              value={teamOverdue}
              icon={AlertCircle}
              color={teamOverdue > 0 ? 'text-red-600' : 'text-emerald-600'}
              bg={teamOverdue > 0 ? 'bg-red-50' : 'bg-emerald-50'}
              onClick={() => navigate('/special-tasks', { state: { view: 'team' } })}
            />
            <StatCard
              label="Pending Approvals"
              value={pendingApprovals}
              icon={Bell}
              color={pendingApprovals > 0 ? 'text-amber-600' : 'text-slate-500'}
              bg={pendingApprovals > 0 ? 'bg-amber-50' : 'bg-slate-100'}
              onClick={() => navigate('/approval-center')}
            />
          </div>

          {/* Pending JDs needing review */}
          {pendingJDs.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">Awaiting Your Approval</span>
                </div>
                <button onClick={() => navigate('/approval-center')} className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-0.5">
                  Review all <ArrowRight size={11} />
                </button>
              </div>
              <div className="divide-y divide-amber-100">
                {pendingJDs.map((jd) => <JDRow key={jd.id} jd={jd} profiles={profiles} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Organisation (directors+) ──────────────────────────────────────── */}
      {isDirector && (
        <div>
          <SectionHeading title="Organisation" action="Manage" onAction={() => navigate('/manage-employees')} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Total Employees"
              value={orgEmployees}
              icon={Users}
              color="text-slate-700"
              bg="bg-slate-100"
              onClick={() => navigate('/manage-employees')}
            />
            <StatCard
              label="Active Directions"
              value={orgActiveJDs}
              icon={Briefcase}
              color="text-blue-600"
              bg="bg-blue-50"
              onClick={() => navigate('/job-directions')}
            />
            <StatCard
              label="Active Tasks"
              value={orgActiveTasks}
              icon={CheckSquare}
              color="text-indigo-600"
              bg="bg-indigo-50"
              onClick={() => navigate('/special-tasks')}
            />
            <StatCard
              label="Overdue Items"
              value={orgOverdue}
              icon={AlertCircle}
              color={orgOverdue > 0 ? 'text-red-600' : 'text-emerald-600'}
              bg={orgOverdue > 0 ? 'bg-red-50' : 'bg-emerald-50'}
              onClick={() => navigate('/special-tasks')}
            />
          </div>
        </div>
      )}

    </div>
  )
}
