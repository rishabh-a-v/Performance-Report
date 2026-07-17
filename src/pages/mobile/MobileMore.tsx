import { useNavigate } from 'react-router-dom'
import {
  BarChart2, Network, ShieldCheck, LogOut, ChevronRight, Sun, Moon,
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { useNotifications } from '@/hooks/useNotifications'

const ADMIN_ROLES: readonly string[] = ['managing_director', 'executive_assistant', 'hr']

function Row({ icon: Icon, label, badge, onClick }: { icon: any; label: string; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left active:bg-muted/60"
    >
      <Icon size={18} className="shrink-0 text-primary" />
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      {!!badge && (
        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{badge}</span>
      )}
      <ChevronRight size={16} className="text-muted-foreground/50" />
    </button>
  )
}

export function MobileMore() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()
  const { approvalBadge, isManager } = useNotifications()
  const { theme, toggleTheme } = useTheme()

  if (!user || !role) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Avatar name={user.full_name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{user.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">{role.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Row icon={BarChart2} label="Reports" onClick={() => navigate('/reports')} />
      </div>



      {ADMIN_ROLES.includes(role) && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Row icon={Network} label="Org Chart" onClick={() => navigate('/admin/org-chart')} />
          <Row icon={ShieldCheck} label="Role Permissions" onClick={() => navigate('/admin/role-permissions')} />
        </div>
      )}

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-950 dark:bg-red-950/20 px-4 py-3.5 text-sm font-semibold text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-950/30"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  )
}
