import { Outlet } from 'react-router-dom'
import { TopBar } from './TopBar'

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
