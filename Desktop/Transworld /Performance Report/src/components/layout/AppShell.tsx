import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { cn } from '@/lib/utils'

const PAGE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/tasks':          { title: 'My Work',            subtitle: 'Tasks assigned to you' },
  '/calendar':       { title: 'Calendar',           subtitle: 'Your tasks by due date' },
  '/daily-review':   { title: 'Daily Pulse',        subtitle: 'Your daily check-in' },
  '/productivity':   { title: 'My Productivity',    subtitle: 'Personal performance overview' },
  '/job-directions': { title: 'Job Directions',     subtitle: 'Your long-term objectives and KPIs' },
  '/special-tasks':  { title: 'Special Tasks',      subtitle: 'Short-term assignments from your manager' },
  '/team':              { title: 'Team Overview',        subtitle: 'Direct report performance' },
  '/team-tasks':        { title: 'Team Tasks',           subtitle: 'All tasks across your team' },
  '/team-productivity': { title: 'Team Productivity',    subtitle: 'Outcome-based task progress' },
  '/blockers':          { title: 'Team Blockers',        subtitle: 'Active impediments' },
  '/pulse-feed':        { title: 'Team Check-ins',       subtitle: 'Daily check-ins from your team' },
  '/date-approvals':    { title: 'Date Approvals',       subtitle: 'Pending due date change requests' },
  '/approval-center':   { title: 'Approval Center',      subtitle: 'Review and approve team Job Directions' },
  '/department':     { title: 'Department',         subtitle: 'Department-wide analytics' },
  '/executive':      { title: 'Executive Overview', subtitle: 'Company-wide intelligence' },
  '/finance':        { title: 'Finance',            subtitle: 'Billing, invoices & audits' },
  '/analytics':      { title: 'Analytics',          subtitle: 'Organisational insights' },
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
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className={cn('flex-1 overflow-y-auto bg-surface-50 p-5 lg:p-6')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
