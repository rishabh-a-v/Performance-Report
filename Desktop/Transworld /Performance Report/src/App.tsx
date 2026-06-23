import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/auth/Login'
import { MyWork } from '@/pages/employee/MyWork'
import { DailyPulse } from '@/pages/employee/DailyPulse'
import { MyProductivity } from '@/pages/employee/MyProductivity'
import { TeamOverview } from '@/pages/manager/TeamOverview'
import { TeamProductivity } from '@/pages/manager/TeamProductivity'
import { TeamBlockers } from '@/pages/manager/TeamBlockers'
import { TeamPulseFeed } from '@/pages/manager/TeamPulseFeed'
import { DepartmentDashboard } from '@/pages/department/DepartmentDashboard'
import { ExecutiveDashboard } from '@/pages/executive/ExecutiveDashboard'
import { FinanceDashboard } from '@/pages/finance/FinanceDashboard'
import { Analytics } from '@/pages/analytics/Analytics'
import type { UserRole } from '@/types/database'

const ROLE_LEVEL: Record<UserRole, number> = {
  employee: 0, manager: 1, department_head: 2, executive: 3,
}

function Protected({ children, minRole }: { children: React.ReactNode; minRole?: UserRole }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (minRole && role && ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/my-work" replace />
  }
  return <>{children}</>
}

function DefaultRedirect() {
  const { role } = useAuth()
  if (role === 'executive') return <Navigate to="/executive" replace />
  if (role === 'department_head') return <Navigate to="/department" replace />
  if (role === 'manager') return <Navigate to="/team" replace />
  return <Navigate to="/my-work" replace />
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
        <Route path="/my-work"      element={<Protected><MyWork /></Protected>} />
        <Route path="/daily-pulse"  element={<Protected><DailyPulse /></Protected>} />
        <Route path="/productivity" element={<Protected><MyProductivity /></Protected>} />

        {/* Manager */}
        <Route path="/team"              element={<Protected minRole="manager"><TeamOverview /></Protected>} />
        <Route path="/team-productivity" element={<Protected minRole="manager"><TeamProductivity /></Protected>} />
        <Route path="/blockers"          element={<Protected minRole="manager"><TeamBlockers /></Protected>} />
        <Route path="/pulse-feed"        element={<Protected minRole="manager"><TeamPulseFeed /></Protected>} />

        {/* Department Head */}
        <Route path="/department" element={<Protected minRole="department_head"><DepartmentDashboard /></Protected>} />

        {/* Executive */}
        <Route path="/executive" element={<Protected minRole="executive"><ExecutiveDashboard /></Protected>} />

        {/* Finance */}
        <Route path="/finance" element={<Protected minRole="department_head"><FinanceDashboard /></Protected>} />

        {/* Analytics */}
        <Route path="/analytics" element={<Protected minRole="manager"><Analytics /></Protected>} />

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
