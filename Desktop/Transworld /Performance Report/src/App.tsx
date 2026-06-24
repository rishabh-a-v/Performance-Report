import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/auth/Login'
import { MyWork } from '@/pages/employee/MyWork'
import { DailyPulse } from '@/pages/employee/DailyPulse'
import { MyProductivity } from '@/pages/employee/MyProductivity'
import { CalendarView } from '@/pages/employee/CalendarView'
import { JobDirections } from '@/pages/employee/JobDirections'
import { SpecialTasks } from '@/pages/employee/SpecialTasks'
import { TeamOverview } from '@/pages/manager/TeamOverview'
import { TeamTasks } from '@/pages/manager/TeamTasks'
import { TeamProductivity } from '@/pages/manager/TeamProductivity'
import { TeamBlockers } from '@/pages/manager/TeamBlockers'
import { TeamPulseFeed } from '@/pages/manager/TeamPulseFeed'
import { ApprovalCenter } from '@/pages/manager/ApprovalCenter'
import { DepartmentDashboard } from '@/pages/department/DepartmentDashboard'
import { ExecutiveDashboard } from '@/pages/executive/ExecutiveDashboard'
import { FinanceDashboard } from '@/pages/finance/FinanceDashboard'
import { Analytics } from '@/pages/analytics/Analytics'
import { CSCReport } from '@/pages/operations/CSCReport'
import { CETReport } from '@/pages/operations/CETReport'
import { EQBDashboard } from '@/pages/operations/EQBDashboard'
import { UnbilledMonitor } from '@/pages/operations/UnbilledMonitor'
import { BranchPerformance } from '@/pages/operations/BranchPerformance'
import { PerformanceEngine } from '@/pages/manager/PerformanceEngine'
import type { UserRole } from '@/types/database'

const ROLE_LEVEL: Record<UserRole, number> = {
  executive: 0, manager: 1, director: 2, managing_director: 3,
}

function Protected({ children, minRole }: { children: React.ReactNode; minRole?: UserRole }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (minRole && role && ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/job-directions" replace />
  }
  return <>{children}</>
}

function DefaultRedirect() {
  const { role } = useAuth()
  if (role === 'managing_director') return <Navigate to="/executive" replace />
  if (role === 'director') return <Navigate to="/department" replace />
  if (role === 'manager') return <Navigate to="/team" replace />
  return <Navigate to="/job-directions" replace />
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<DefaultRedirect />} />

        {/* Employee */}
        <Route path="/tasks"          element={<Protected><MyWork /></Protected>} />
        <Route path="/calendar"       element={<Protected><CalendarView /></Protected>} />
        <Route path="/daily-review"   element={<Protected><DailyPulse /></Protected>} />
        <Route path="/productivity"   element={<Protected><MyProductivity /></Protected>} />
        <Route path="/job-directions" element={<Protected><JobDirections /></Protected>} />
        <Route path="/special-tasks"  element={<Protected><SpecialTasks /></Protected>} />
        <Route path="/performance-reviews" element={<Navigate to="/daily-review" replace />} />

        {/* Manager */}
        <Route path="/team"              element={<Protected minRole="manager"><TeamOverview /></Protected>} />
        <Route path="/team-tasks"        element={<Protected minRole="manager"><TeamTasks /></Protected>} />
        <Route path="/team-productivity" element={<Protected minRole="manager"><TeamProductivity /></Protected>} />
        <Route path="/blockers"          element={<Protected minRole="manager"><TeamBlockers /></Protected>} />
        <Route path="/pulse-feed"        element={<Protected minRole="manager"><TeamPulseFeed /></Protected>} />
        <Route path="/date-approvals"    element={<Navigate to="/approval-center" replace />} />
        <Route path="/approval-center"   element={<Protected minRole="manager"><ApprovalCenter /></Protected>} />

        {/* Department Head */}
        <Route path="/department" element={<Protected minRole="director"><DepartmentDashboard /></Protected>} />

        {/* Managing Director */}
        <Route path="/executive" element={<Protected minRole="managing_director"><ExecutiveDashboard /></Protected>} />

        {/* Finance */}
        <Route path="/finance" element={<Protected minRole="director"><FinanceDashboard /></Protected>} />

        {/* Analytics */}
        <Route path="/analytics" element={<Protected minRole="manager"><Analytics /></Protected>} />

        {/* Operations */}
        <Route path="/csc-report"    element={<Protected><CSCReport /></Protected>} />
        <Route path="/cet-report"    element={<Protected><CETReport /></Protected>} />
        <Route path="/eqb"           element={<Protected minRole="manager"><EQBDashboard /></Protected>} />
        <Route path="/unbilled"      element={<Protected minRole="manager"><UnbilledMonitor /></Protected>} />
        <Route path="/branch-perf"   element={<Protected minRole="manager"><BranchPerformance /></Protected>} />
        <Route path="/perf-engine"   element={<Protected minRole="manager"><PerformanceEngine /></Protected>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
