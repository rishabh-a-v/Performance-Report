import { NavLink } from 'react-router-dom'
import { Briefcase, CheckSquare, Calendar, Menu, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useReportingStore } from '@/store/reportingStore'

export function MobileBottomNav() {
  const { user } = useAuth()
  const reportingRecords = useReportingStore((s) => s.reportingRecords)
  const isExcluded = ['hr', 'managing_director', 'executive_assistant'].includes(user?.role || '')
  const hasReportees = reportingRecords.some((r) => r.reporting_to_id === user?.id)
  const showEmployees = isExcluded || hasReportees

  const tabs = [
    { to: '/tasks',          label: 'Tasks',    icon: CheckSquare },
    { to: '/job-directions', label: 'JDs',      icon: Briefcase },
    ...(showEmployees ? [{ to: '/manage-employees', label: 'Employees', icon: Users }] : []),
    { to: '/calendar',       label: 'Calendar', icon: Calendar },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16 items-stretch">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon size={22} strokeWidth={2.25} />
            {label}
          </NavLink>
        ))}
        <NavLink
          to="/more"
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <Menu size={22} strokeWidth={2.25} />
          More
        </NavLink>
      </div>
    </nav>
  )
}
