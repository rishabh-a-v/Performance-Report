import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import {
  LayoutDashboard, CheckSquare, Activity, Users, AlertTriangle,
  TrendingUp, Building2, Globe2, DollarSign, FileText, BarChart3,
  Settings, LogOut, Zap, Target, type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  minRole?: string
}

const NAV_ITEMS: NavItem[] = [
  // Employee
  { label: 'My Work',         to: '/my-work',        icon: CheckSquare },
  { label: 'Daily Pulse',     to: '/daily-pulse',    icon: Activity },
  { label: 'My Productivity', to: '/productivity',   icon: TrendingUp },
  // Manager
  { label: 'Team Overview',      to: '/team',               icon: Users,          minRole: 'manager' },
  { label: 'Team Productivity',  to: '/team-productivity',  icon: Target,         minRole: 'manager' },
  { label: 'Team Blockers',      to: '/blockers',           icon: AlertTriangle,  minRole: 'manager' },
  { label: 'Pulse Feed',         to: '/pulse-feed',         icon: Zap,            minRole: 'manager' },
  // Dept Head
  { label: 'Department',      to: '/department',     icon: Building2,      minRole: 'department_head' },
  // Executive
  { label: 'Executive',       to: '/executive',      icon: Globe2,         minRole: 'executive' },
  // Finance
  { label: 'Finance',         to: '/finance',        icon: DollarSign,     minRole: 'department_head' },
  // Analytics
  { label: 'Analytics',       to: '/analytics',      icon: BarChart3,      minRole: 'manager' },
]

const ROLE_ORDER: Record<string, number> = {
  employee: 0, manager: 1, department_head: 2, executive: 3,
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, role, signOut } = useAuth()
  if (!user || !role) return null

  const roleLevel = ROLE_ORDER[role] ?? 0

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.minRole) return true
    return roleLevel >= ROLE_ORDER[item.minRole]
  })

  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#0f172a]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 text-white">
          <LayoutDashboard size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Transworld</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Management Intelligence</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={16}
                  className={cn(isActive ? 'text-brand-400' : 'text-slate-500')}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-white">{user.full_name}</p>
            <p className="truncate text-[10px] text-slate-500">{user.designation}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
