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
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-5 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-xs text-slate-400 sm:block">{formatDate(new Date())}</span>
        <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
          <Search size={16} />
        </button>
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <Avatar name={user.full_name} size="sm" />
      </div>
    </header>
  )
}
