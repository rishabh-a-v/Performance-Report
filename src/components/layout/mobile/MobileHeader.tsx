import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, ClipboardCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationsSheet } from './NotificationsSheet'
import { ROUTE_TITLES } from '@/lib/routes'

export function MobileHeader() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { unreadCount, approvalBadge, isManager } = useNotifications()

  const title = ROUTE_TITLES[location.pathname] ?? 'Transworld'

  return (
    <>
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
        <div className="flex items-center gap-1">
          {isManager && (
            <button
              onClick={() => navigate('/approval-center')}
              className="relative rounded-lg p-2 text-muted-foreground active:bg-muted"
              title="Approvals"
            >
              <ClipboardCheck size={20} />
              {approvalBadge > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white">
                  {approvalBadge > 9 ? '9+' : approvalBadge}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setSheetOpen(true)}
            className="relative rounded-lg p-2 text-muted-foreground active:bg-muted"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>
      <NotificationsSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  )
}
