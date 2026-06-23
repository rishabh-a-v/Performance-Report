import { Bell, Search, Menu, HelpCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'

interface TopBarProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const { user } = useAuth()
  if (!user) return null

  // Format breadcrumbs based on active page title
  const getBreadcrumbs = () => {
    if (title === 'My Work') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Transworld</span>
          <span>/</span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="text-[10px]">㗊</span> WeCraft
          </span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <span className="font-semibold text-slate-500">Transworld</span>
        <span>/</span>
        <span className="flex items-center gap-1 text-slate-500">
          <span className="text-[10px]">㗊</span> WeCraft
        </span>
        <span>/</span>
        <span className="font-medium text-slate-700">{title}</span>
      </div>
    )
  }

  return (
    <header className="flex h-11 items-center justify-between bg-transparent px-5 pt-3 shrink-0 gap-4">
      {/* Left side: Mobile menu trigger + Breadcrumbs */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="rounded p-1 text-slate-400 hover:bg-slate-200/50 lg:hidden"
        >
          <Menu size={16} />
        </button>
        {getBreadcrumbs()}
      </div>

      {/* Right side: Bell icon and user avatar */}
      <div className="flex items-center gap-3 shrink-0">
        <button className="relative rounded p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600 transition-colors">
          <Bell size={15} />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>
        <Avatar name={user.full_name} size="xs" className="ring-1 ring-slate-200" />
      </div>
    </header>
  )
}
