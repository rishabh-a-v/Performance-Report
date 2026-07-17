import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { useNativeAppSetup } from '@/hooks/useNativeAppSetup'
import { AppShell } from '@/components/layout/AppShell'
import { MobileAppShell } from '@/components/layout/mobile/MobileAppShell'
import { Login } from '@/pages/auth/Login'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { MobileMore } from '@/pages/mobile/MobileMore'
import { useIsNativeApp } from '@/hooks/useIsNativeApp'
import { useLiveNotifications } from '@/hooks/useLiveNotifications'
import { CalendarView } from '@/pages/employee/CalendarView'
import { JobDirections } from '@/pages/employee/JobDirections'
import { ManageEmployees } from '@/pages/employee/ManageEmployees'
import { RolePermissions } from '@/pages/admin/RolePermissions'
import { OrgChart } from '@/pages/admin/OrgChart'

import { ApprovalCenter } from '@/pages/manager/ApprovalCenter'
import { EmployeeReports } from '@/pages/reports/EmployeeReports'
import { CapacityPlanning } from '@/pages/capacity/CapacityPlanning'
import type { UserRole } from '@/types/database'

import { useProfileStore } from '@/store/profileStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { usePermissionStore } from '@/store/permissionStore'
import { useReportingStore } from '@/store/reportingStore'
import { useTeamJobStore } from '@/store/teamJobStore'
import { useCapacityStore } from '@/store/capacityStore'

const ROLE_LEVEL: Record<UserRole, number> = {
  executive: 0, executive_assistant: 3, hr: 3, manager: 1, director: 2, managing_director: 3,
}

function Protected({ children, minRole }: { children: React.ReactNode; minRole?: UserRole }) {
  const { isAuthenticated, role, isLoading } = useAuth()
  // Wait for the auth session to resolve before deciding — otherwise a hard
  // refresh on a deep link always bounces through /login back to /tasks.
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (minRole) {
    if (!role || ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
      return <Navigate to="/tasks" replace />
    }
  }
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, role } = useAuth()
  const isNativeApp = useIsNativeApp()
  const Shell = isNativeApp ? MobileAppShell : AppShell

  useLiveNotifications()
  useNativeAppSetup()

  useEffect(() => {
    if (isAuthenticated && role) {
      useProfileStore.getState().fetchAll()
      useJobDirectionStore.getState().fetchAll()
      useSpecialTaskStore.getState().fetchTasks()
      usePermissionStore.getState().fetchPermissions(role)
      useTeamJobStore.getState().fetchJobs()
      useCapacityStore.getState().fetchPlans()

      const unsubs = [
        useProfileStore.getState().subscribeToRealtime(),
        useReportingStore.getState().subscribeToRealtime(),
        useJobDirectionStore.getState().subscribeToRealtime(),
        useSpecialTaskStore.getState().subscribeToRealtime(),
        usePermissionStore.getState().subscribeToRealtime(role),
        useTeamJobStore.getState().subscribeToRealtime(),
        useCapacityStore.getState().subscribeToRealtime(),
      ]
      return () => { unsubs.forEach((u) => u()) }
    }
  }, [isAuthenticated, role])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/tasks" replace />} />

        {/* Core */}
        <Route path="/tasks"          element={<Protected><TasksPage /></Protected>} />
        <Route path="/job-directions" element={<Protected><JobDirections /></Protected>} />
        <Route path="/calendar"       element={<Protected><CalendarView /></Protected>} />
        {isNativeApp && <Route path="/more" element={<Protected><MobileMore /></Protected>} />}

        {/* Reports — all authenticated users */}
        <Route path="/reports" element={<Protected><EmployeeReports /></Protected>} />

        {/* Capacity — director+ */}
        <Route path="/capacity" element={<Protected minRole="director"><CapacityPlanning /></Protected>} />

        {/* Manager */}
        <Route path="/manage-employees" element={<Protected><ManageEmployees /></Protected>} />
        <Route path="/approval-center"  element={<Protected minRole="manager"><ApprovalCenter /></Protected>} />

        {/* Admin — MD / EA / HR only (role level 3) */}
        <Route path="/admin/role-permissions" element={<Protected minRole="managing_director"><RolePermissions /></Protected>} />
        <Route path="/admin/org-chart"        element={<Protected minRole="managing_director"><OrgChart /></Protected>} />

        {/* Legacy redirects — old bookmarks and deep links keep working */}
        <Route path="/overview"            element={<Navigate to="/tasks" replace />} />
        <Route path="/special-tasks"       element={<Navigate to="/tasks" replace />} />
        <Route path="/team-jobs"           element={<Navigate to="/tasks" replace />} />
        <Route path="/performance-reviews" element={<Navigate to="/tasks" replace />} />
        <Route path="/add-employee"        element={<Navigate to="/manage-employees" replace />} />
        <Route path="/date-approvals"      element={<Navigate to="/approval-center" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
