import { NavLink, useNavigate } from 'react-router-dom'
import {
  Briefcase, CheckSquare, Users, Calendar, BarChart2,
  ClipboardCheck, Network, ShieldCheck, X,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import { useReportingStore } from '@/store/reportingStore'

const PEOPLE_MGMT_ROLES: readonly string[] = ['managing_director', 'executive_assistant', 'hr', 'director']
const ADMIN_ROLES: readonly string[] = ['managing_director', 'executive_assistant', 'hr']

// Temporarily hidden from the nav — flip back to true to re-enable.
const SHOW_CAPACITY_NAV = false

const NAV_ITEMS = [
  { to: '/tasks',          label: 'Tasks',           icon: CheckSquare },
  { to: '/job-directions', label: 'Job Directions', icon: Briefcase },
  { to: '/calendar',       label: 'Calendar',        icon: Calendar },
  { to: '/reports',        label: 'Reports',         icon: BarChart2 },
] as const

function NavItem({ to, label, icon: Icon, badge }: { to: string; label: string; icon: React.ElementType; badge?: number }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {!!badge && (
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 tabular-nums">{badge}</span>
      )}
    </NavLink>
  )
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, user } = useAuth()
  const navigate = useNavigate()
  const { approvalBadge, isManager } = useNotifications()
  const reportingRecords = useReportingStore((s) => s.reportingRecords)

  if (!role) return null

  const showPeopleMgmt = PEOPLE_MGMT_ROLES.includes(role)
  const showAdmin = ADMIN_ROLES.includes(role)

  const isExcluded = ['hr', 'managing_director', 'executive_assistant'].includes(role)
  const hasReportees = reportingRecords.some((r) => r.reporting_to_id === user?.id)
  const showEmployees = isExcluded || hasReportees

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border px-5">
          <button onClick={() => navigate('/tasks')} className="transition-all hover:scale-105 active:scale-95 duration-200">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white p-1 border border-border shadow-sm">
              <img src="/ti-logo.png" alt="TransWorld International" className="h-full w-full object-contain" />
            </div>
          </button>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => <NavItem key={item.to} {...item} />)}

          {SHOW_CAPACITY_NAV && PEOPLE_MGMT_ROLES.includes(role) && (
            <NavItem to="/capacity" label="Capacity" icon={BarChart2} />
          )}

          {isManager && (
            <NavItem to="/approval-center" label="Approvals" icon={ClipboardCheck} badge={approvalBadge} />
          )}

          {(showPeopleMgmt || showAdmin || isManager) && showEmployees && (
            <div className="pt-4">
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">People</p>
              {(showPeopleMgmt || isManager) && (
                <NavItem to="/manage-employees" label="Employees" icon={Users} />
              )}
              {showAdmin && (
                <>
                  <NavItem to="/admin/org-chart" label="Org Chart" icon={Network} />
                  <NavItem to="/admin/role-permissions" label="Role Permissions" icon={ShieldCheck} />
                </>
              )}
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}
