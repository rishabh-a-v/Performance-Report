import { useNavigate } from 'react-router-dom'
import { Bell, CheckSquare, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications, type NotificationItem } from '@/hooks/useNotifications'

const notifIcon = (t: NotificationItem['type']) =>
  t === 'overdue' ? <Clock size={13} className="text-amber-500" /> : <CheckSquare size={13} className="text-primary" />
const notifDot = (t: NotificationItem['type']) => (t === 'overdue' ? 'bg-amber-50' : 'bg-blue-50')

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  if (!open) return null

  function handleClick(n: NotificationItem) {
    markRead(n.id); onClose(); navigate(n.path)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative flex max-h-[80vh] flex-col rounded-t-2xl bg-card shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-muted-foreground" />
            <span className="text-sm font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{unreadCount} new</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[11px] font-semibold text-primary">Mark all read</button>
            )}
            <button onClick={onClose} className="text-muted-foreground"><X size={16} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2 text-muted-foreground">
              <Bell size={26} className="opacity-30" />
              <p className="text-xs font-medium">You're all caught up!</p>
            </div>
          ) : notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-left', !n.read && 'bg-primary/5')}
            >
              <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', notifDot(n.type))}>
                {notifIcon(n.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn('text-xs font-semibold text-foreground leading-snug', n.read && 'font-medium text-muted-foreground')}>{n.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug">{n.body}</p>
              </div>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
