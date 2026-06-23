import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import {
  CheckSquare, Activity, TrendingUp, Users, Target, AlertTriangle,
  Zap, Building2, Globe2, DollarSign, BarChart3, LogOut,
  Plus, ChevronsUpDown
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: any
  minRole?: string
  badgeCount?: number
}

const ROLE_ORDER: Record<string, number> = {
  employee: 0,
  manager: 1,
  department_head: 2,
  executive: 3,
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, role, signOut } = useAuth()
  if (!user || !role) return null

  const roleLevel = ROLE_ORDER[role] ?? 0

  // 1. Employee items (My Workspace)
  const employeeItems = [
    { label: 'My Work', to: '/my-work', icon: CheckSquare, badgeCount: 5 },
    { label: 'Daily Pulse', to: '/daily-pulse', icon: Activity },
    { label: 'My Productivity', to: '/productivity', icon: TrendingUp },
  ]

  // 2. Manager items (Team Dashboards)
  const managerItems = [
    { label: 'Team Overview', to: '/team', icon: Users, minRole: 'manager' },
    { label: 'Team Productivity', to: '/team-productivity', icon: Target, minRole: 'manager' },
    { label: 'Team Blockers', to: '/blockers', icon: AlertTriangle, minRole: 'manager' },
    { label: 'Pulse Feed', to: '/pulse-feed', icon: Zap, minRole: 'manager' },
  ].filter((item) => !item.minRole || roleLevel >= ROLE_ORDER[item.minRole])

  // 3. Dept Head / Executive / Finance / Analytics (Organizational)
  const orgItems = [
    { label: 'Department', to: '/department', icon: Building2, minRole: 'department_head' },
    { label: 'Executive', to: '/executive', icon: Globe2, minRole: 'executive' },
    { label: 'Finance', to: '/finance', icon: DollarSign, minRole: 'department_head' },
    { label: 'Analytics', to: '/analytics', icon: BarChart3, minRole: 'manager' },
  ].filter((item) => !item.minRole || roleLevel >= ROLE_ORDER[item.minRole])

  return (
    <aside className="flex h-full flex-col border-r border-slate-200 bg-[#f4f5f7] text-slate-700">
      {/* Top User Profile Block */}
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={user.full_name} size="sm" className="ring-1 ring-slate-200" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-800">{user.full_name}</p>
            <p className="truncate text-[10px] text-slate-400 font-medium">{user.designation}</p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        {/* Workspace Items */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
            <span>My Workspace</span>
          </div>
          <nav className="space-y-0.5">
            {employeeItems.map((item) => (
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
                  <span className="flex h-4 min-w-4 items-center justify-center rounded bg-slate-200/85 px-1 text-[9px] font-semibold text-slate-600 tabular-nums">
                    {item.badgeCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Team Dashboards Section */}
        {managerItems.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
              <span>Team Dashboards</span>
            </div>
            <nav className="space-y-0.5">
              {managerItems.map((item) => (
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
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Organizational Section */}
        {orgItems.length > 0 && (
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400/80">
              <span>Organizational</span>
            </div>
            <nav className="space-y-0.5">
              {orgItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-slate-200/60 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-200/30 hover:text-slate-900',
                    )
                  }
                >
                  <item.icon size={14} className="text-slate-500 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Footer Section */}
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
