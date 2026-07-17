import { Outlet } from 'react-router-dom'
import { MobileHeader } from './MobileHeader'
import { MobileBottomNav } from './MobileBottomNav'

export function MobileAppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MobileHeader />
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  )
}
