import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { Login } from '@/pages/auth/Login'
import { Overview } from '@/pages/overview/Overview'
import { CalendarView } from '@/pages/employee/CalendarView'
import { JobDirections } from '@/pages/employee/JobDirections'
import { SpecialTasks } from '@/pages/employee/SpecialTasks'
import { AddEmployee } from '@/pages/employee/AddEmployee'
import { ManageEmployees } from '@/pages/employee/ManageEmployees'
import { RolePermissions } from '@/pages/admin/RolePermissions'

import { ApprovalCenter } from '@/pages/manager/ApprovalCenter'
import type { UserRole } from '@/types/database'

import { useProfileStore } from '@/store/profileStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { usePermissionStore } from '@/store/permissionStore'

const ROLE_LEVEL: Record<UserRole, number> = {
  executive: 0, executive_assistant: 3, hr: 3, manager: 1, director: 2, managing_director: 3,
}

function Protected({ children, minRole }: { children: React.ReactNode; minRole?: UserRole }) {
  const { isAuthenticated, role } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (minRole && role && ROLE_LEVEL[role] < ROLE_LEVEL[minRole]) {
    return <Navigate to="/overview" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated, role } = useAuth()

  useEffect(() => {
    if (isAuthenticated && role) {
      useProfileStore.getState().fetchAll()
      useJobDirectionStore.getState().fetchAll()
      useSpecialTaskStore.getState().fetchTasks()
      usePermissionStore.getState().fetchPermissions(role)
    }
  }, [isAuthenticated, role])

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
        <Route index element={<Navigate to="/overview" replace />} />

        {/* Core */}
        <Route path="/overview"       element={<Protected><Overview /></Protected>} />
        <Route path="/job-directions" element={<Protected><JobDirections /></Protected>} />
        <Route path="/special-tasks"  element={<Protected><SpecialTasks /></Protected>} />
        <Route path="/calendar"       element={<Protected><CalendarView /></Protected>} />

        {/* Manager */}
        <Route path="/add-employee"      element={<Protected><AddEmployee /></Protected>} />
        <Route path="/manage-employees"  element={<Protected><ManageEmployees /></Protected>} />
        <Route path="/approval-center"   element={<Protected minRole="manager"><ApprovalCenter /></Protected>} />

        {/* Admin */}
        <Route path="/admin/role-permissions" element={<Protected><RolePermissions /></Protected>} />


        {/* Legacy redirects */}
        <Route path="/tasks"             element={<Navigate to="/special-tasks" replace />} />
        <Route path="/date-approvals"    element={<Navigate to="/approval-center" replace />} />
        <Route path="/performance-reviews" element={<Navigate to="/overview" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
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
