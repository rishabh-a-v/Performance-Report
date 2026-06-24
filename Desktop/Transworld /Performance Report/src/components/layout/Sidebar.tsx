import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import {
  Activity, TrendingUp, Users, Target, AlertTriangle,
  Zap, Building2, Globe2, DollarSign, BarChart3, LogOut,
  Compass, ListTodo, ClipboardCheck, CalendarDays, CheckSquare,
  Phone, FileText, ShoppingCart, FileX, MapPin, Award,
} from 'lucide-react'
import { useBlockerStore } from '@/store/blockerStore'
import { useCheckinStore } from '@/store/checkinStore'
import { useChangeRequestStore } from '@/store/changeRequestStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useReviewStore } from '@/store/reviewStore'
import { PROFILES } from '@/lib/mockData'

interface NavItem {
  label: string
  to: string
  icon: any
  minRole?: string
  badgeCount?: number
}

const ROLE_ORDER: Record<string, number> = {
  executive: 0,
  manager: 1,
  director: 2,
  managing_director: 3,
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, role, signOut } = useAuth()

  // Compute directReportIds early (before hooks that depend on it)
  const directReportIds = PROFILES.filter((p) => p.manager_id === (user?.id ?? '')).map((p) => p.id)

  // Reactive store subscriptions
  const pendingApprovals = useChangeRequestStore((s) => s.requests.filter((r) => r.status === 'pending').length)
  const activeBlockersCount = useBlockerStore((s) =>
    s.blockers.filter((b) => !b.resolved_at && directReportIds.includes(b.employee_id)).length
  )
  const checkinCount = useCheckinStore((s) =>
    s.checkins.filter((c) => c.checkin_date === new Date().toISOString().slice(0, 10)).length
  )
  const myJDCount = useJobDirectionStore((s) =>
    s.directions.filter((d) => d.employee_id === (user?.id ?? '') && ['active', 'rejected'].includes(d.status)).length
  )
  const mySpecialTaskCount = useSpecialTaskStore((s) =>
    s.tasks.filter((t) => t.assigned_to === (user?.id ?? '') && t.status !== 'completed').length
  )
  const pendingApprovalsJD = useJobDirectionStore((s) =>
    s.directions.filter((d) => d.manager_id === (user?.id ?? '') && d.status === 'submitted').length
  )
  // Team Tasks badge: active JDs + pending STs for direct reports
  const teamJDActiveCount = useJobDirectionStore((s) =>
    s.directions.filter((d) => directReportIds.includes(d.employee_id) && ['active', 'rejected'].includes(d.status)).length
  )
  const teamSTActiveCount = useSpecialTaskStore((s) =>
    s.tasks.filter((t) => directReportIds.includes(t.assigned_to) && t.status !== 'completed').length
  )
  // Calendar badge: overdue special tasks
  const _today = new Date().toISOString().slice(0, 10)
  const overdueCount = useSpecialTaskStore((s) =>
    s.tasks.filter((t) => t.assigned_to === (user?.id ?? '') && t.due_date && t.due_date < _today && t.status !== 'completed').length
  )

  if (!user || !role) return null

  const roleLevel = ROLE_ORDER[role] ?? 0
  const teamInProgressCount = teamJDActiveCount + teamSTActiveCount

  // Performance Reviews pending counts
  const reviews = useReviewStore((s) => s.reviews)
  const checkins = useCheckinStore((s) => s.checkins)
  
  const todayStr = new Date().toISOString().slice(0, 10)
  const isHigherEmployee = directReportIds.length > 0
  
  // 1. Daily Self Review needs submission (for current day)
  const mySelfReview = reviews.find((r) => r.employee_id === user.id && r.review_type === 'self' && r.review_period === todayStr)
  const selfNeedsSubmit = !mySelfReview || mySelfReview.status === 'draft' || mySelfReview.status === 'rejected'

  let dailyBadgeCount = 0
  if (user.role === 'managing_director') {
    dailyBadgeCount = 0
  } else if (isHigherEmployee) {
    const selfCount = selfNeedsSubmit ? 1 : 0
    const pendingSubordinateCount = directReportIds.filter((reporteeId) => {
      const subReview = reviews.find(
        (r) => r.employee_id === user.id && 
               r.review_type === 'subordinate' && 
               r.reviewed_employee_id === reporteeId && 
               r.review_period === todayStr
      )
      return !subReview || subReview.status === 'draft' || subReview.status === 'rejected'
    }).length

    const pendingApprovalsReviewCount = reviews.filter((r) => {
      const submitter = PROFILES.find((p) => p.id === r.employee_id)
      return submitter?.manager_id === user.id && r.status === 'submitted'
    }).length

    dailyBadgeCount = selfCount + pendingSubordinateCount + pendingApprovalsReviewCount
  } else {
    dailyBadgeCount = selfNeedsSubmit ? 1 : 0
  }

  // 1. Employee items (My Workspace)
  const employeeItems: NavItem[] = [
    { label: 'Job Directions',      to: '/job-directions',     icon: Compass,      badgeCount: myJDCount || undefined },
    { label: 'Special Tasks',       to: '/special-tasks',      icon: ListTodo,     badgeCount: mySpecialTaskCount || undefined },
    { label: 'Calendar',            to: '/calendar',           icon: CalendarDays, badgeCount: overdueCount || undefined },
    { label: 'Daily Review',        to: '/daily-review',       icon: Activity,     badgeCount: dailyBadgeCount || undefined },
    { label: 'My Productivity',     to: '/productivity',       icon: TrendingUp },
  ]

  // 2. Manager items (Team Dashboards)
  const managerItems: NavItem[] = [
    { 
      label: 'Approval Center',  
      to: '/approval-center',    
      icon: ClipboardCheck, 
      minRole: 'manager', 
      badgeCount: (pendingApprovalsJD + pendingApprovals) || undefined 
    },
    { label: 'Team Overview',    to: '/team',               icon: Users,          minRole: 'manager' },
    { label: 'Team Tasks',       to: '/team-tasks',         icon: CheckSquare,    minRole: 'manager', badgeCount: teamInProgressCount || undefined },
    { label: 'Team Productivity', to: '/team-productivity', icon: Target,         minRole: 'manager' },
    { label: 'Team Blockers',    to: '/blockers',           icon: AlertTriangle,  minRole: 'manager', badgeCount: activeBlockersCount || undefined },
    { label: 'Team Check-ins',   to: '/pulse-feed',         icon: Zap,            minRole: 'manager', badgeCount: checkinCount || undefined },
  ].filter((item) => !item.minRole || roleLevel >= ROLE_ORDER[item.minRole])

  // 3. Operations items
  const operationsItems: NavItem[] = [
    { label: 'CSC Report',      to: '/csc-report',  icon: Phone },
    { label: 'CET Report',      to: '/cet-report',  icon: FileText },
    { label: 'EQB Dashboard',   to: '/eqb',         icon: ShoppingCart, minRole: 'manager' },
    { label: 'Unbilled Monitor',to: '/unbilled',     icon: FileX,        minRole: 'manager' },
    { label: 'Branch Perf.',    to: '/branch-perf',  icon: MapPin,       minRole: 'manager' },
    { label: 'Perf. Engine',    to: '/perf-engine',  icon: Award,        minRole: 'manager' },
  ].filter((item) => !item.minRole || roleLevel >= ROLE_ORDER[item.minRole])

  // 4. Org items
  const orgItems: NavItem[] = [
    { label: 'Department', to: '/department', icon: Building2, minRole: 'director' },
    { label: 'Executive',  to: '/executive',  icon: Globe2,    minRole: 'managing_director' },
    { label: 'Finance',    to: '/finance',    icon: DollarSign, minRole: 'director' },
    { label: 'Analytics',  to: '/analytics',  icon: BarChart3, minRole: 'manager' },
  ].filter((item) => !item.minRole || roleLevel >= ROLE_ORDER[item.minRole])

  function NavSection({ label, items }: { label: string; items: NavItem[] }) {
    if (items.length === 0) return null
    return (
      <div className="space-y-1">
        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">{label}</div>
        <nav className="space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-slate-200/60 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/30 hover:text-slate-900',
                )
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon size={14} className="text-slate-500 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badgeCount !== undefined && (
                <span className={cn(
                  'flex h-4 min-w-4 items-center justify-center rounded px-1 text-[9px] font-semibold tabular-nums',
                  item.to === '/blockers' ? 'bg-red-100 text-red-600' :
                  item.to === '/approval-center' ? 'bg-amber-100 text-amber-700' :
                  item.to === '/daily-review' ? 'bg-indigo-100 text-indigo-700' :
                  item.to === '/calendar' ? 'bg-red-100 text-red-600' :
                  'bg-slate-200/85 text-slate-600'
                )}>
                  {item.badgeCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-[#f4f5f7] text-slate-700">
      {/* User profile */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={user.full_name} size="sm" className="ring-1 ring-slate-200" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">{user.full_name}</p>
            <p className="truncate text-[10px] text-slate-400 font-medium">{user.designation}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        <NavSection label="My Workspace" items={employeeItems} />
        <NavSection label="Team Dashboards" items={managerItems} />
        <NavSection label="Operations & KPIs" items={operationsItems} />
        <NavSection label="Organizational" items={orgItems} />
      </div>

      {/* Sign out */}
      <div className="border-t border-slate-200/80 p-3">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} className="shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
