import { Bell, Search, Menu } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'

interface TopBarProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function TopBar({ title, subtitle, onMenuClick }: TopBarProps) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5 shrink-0 gap-4">
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-[#0f172a]">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {/* Global search */}
      <div className="relative hidden max-w-xs flex-1 sm:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          placeholder="Search shipments, tasks…"
          className="h-8 w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden text-xs text-slate-400 lg:block">{formatDate(new Date())}</span>
        <button className="rounded p-2 text-slate-400 hover:bg-slate-100 transition-colors sm:hidden">
          <Search size={16} />
        </button>
        <button className="relative rounded p-2 text-slate-400 hover:bg-slate-100 transition-colors">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <Avatar name={user.full_name} size="sm" />
      </div>
    </header>
  )
}
