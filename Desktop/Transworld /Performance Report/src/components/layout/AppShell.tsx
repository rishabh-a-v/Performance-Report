import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/my-work':      { title: 'My Work',          subtitle: 'Tasks assigned to you' },
  '/daily-pulse':  { title: 'Daily Pulse',       subtitle: 'Your daily check-in' },
  '/productivity': { title: 'My Productivity',   subtitle: 'Personal performance overview' },
  '/team':              { title: 'Team Overview',        subtitle: 'Direct report performance' },
  '/team-productivity': { title: 'Team Productivity',    subtitle: 'Outcome-based task progress' },
  '/blockers':     { title: 'Team Blockers',      subtitle: 'Active impediments' },
  '/pulse-feed':   { title: 'Team Pulse Feed',    subtitle: 'AI-generated team summary' },
  '/department':   { title: 'Department',         subtitle: 'Department-wide analytics' },
  '/executive':    { title: 'Executive Overview', subtitle: 'Company-wide intelligence' },
  '/finance':      { title: 'Finance',            subtitle: 'Billing, invoices & audits' },
  '/analytics':    { title: 'Analytics',          subtitle: 'Organisational insights' },
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const meta = PAGE_TITLES[location.pathname] ?? { title: 'Dashboard' }

  return (
    <div className="flex h-full">
      {/* Sidebar – desktop */}
      <div className="hidden w-60 shrink-0 lg:flex">
        <div className="flex w-full flex-col">
          <Sidebar />
        </div>
      </div>

      {/* Sidebar – mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full w-60 bg-[#0f172a] shadow-xl">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className={cn('flex-1 overflow-y-auto bg-surface-50 p-5 lg:p-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
