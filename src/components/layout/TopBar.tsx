import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Bell, CheckSquare, Clock, X, ChevronDown, LogOut, Menu, Sun, Moon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications'
import { ROUTE_TITLES } from '@/lib/routes'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, role, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const { theme, toggleTheme } = useTheme()

  const [notifOpen,   setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  useEffect(() => {
    setNotifOpen(false); setProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (notifRef.current   && !notifRef.current.contains(t))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  if (!user || !role) return null

  const title = ROUTE_TITLES[location.pathname] ?? 'Transworld'

  function handleNotifClick(n: NotificationItem) {
    markRead(n.id); setNotifOpen(false); navigate(n.path)
  }

  const notifIcon = (t: NotificationItem['type']) => {
    if (t === 'overdue')  return <Clock size={13} className="text-amber-500" />
    return <CheckSquare size={13} className="text-primary" />
  }
  const notifDot = (t: NotificationItem['type']) => {
    if (t === 'overdue')  return 'bg-amber-50'
    return 'bg-blue-50'
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card px-5 lg:px-8">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Menu size={18} />
      </button>

      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="ml-auto flex items-center gap-1 shrink-0">


        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
            className={cn(
              'relative rounded-lg p-2.5 transition-colors',
              notifOpen ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bell size={13} className="text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{unreadCount} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-semibold text-primary hover:text-primary/80">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={13} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Bell size={24} className="opacity-30" />
                    <p className="text-xs font-medium">You're all caught up!</p>
                  </div>
                ) : notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60', !n.read && 'bg-primary/5')}
                  >
                    <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', notifDot(n.type))}>
                      {notifIcon(n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs font-semibold text-foreground leading-snug', n.read && 'font-medium text-muted-foreground')}>{n.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>

              {notifications.length > 0 && (
                <div className="border-t border-border px-4 py-2.5">
                  <p className="text-center text-[10px] text-muted-foreground font-medium">
                    Showing {notifications.length} recent notifications
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
            className="ml-2 flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-muted"
          >
            <Avatar name={user.full_name} size="sm" className="ring-1 ring-border" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-foreground leading-tight">{user.full_name}</p>
              <p className="text-xs text-muted-foreground leading-tight capitalize">{role.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={15} className={cn('text-muted-foreground transition-transform hidden sm:block', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{user.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{role.replace('_', ' ')}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
