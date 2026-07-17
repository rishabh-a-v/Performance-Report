import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { todayLocalISO } from '@/lib/utils'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useProfileStore } from '@/store/profileStore'
import { useReportingStore } from '@/store/reportingStore'

export interface NotificationItem {
  id: string
  type: 'overdue' | 'jd'
  title: string
  body: string
  time: string
  read: boolean
  path: string
}

const ROLE_ORDER: Record<string, number> = {
  executive: 0, executive_assistant: 3, hr: 3, manager: 1, director: 2, managing_director: 3,
}

const ADMIN_ROLES: readonly string[] = ['managing_director', 'executive_assistant', 'hr']

/** Shared notification + approval-badge computation, used by both the desktop TopBar and the mobile shell. */
export function useNotifications() {
  const { user, role } = useAuth()

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif_read') ?? '[]')) } catch { return new Set() }
  })

  const specialTasks  = useSpecialTaskStore((s) => s.tasks)
  const jobDirections = useJobDirectionStore((s) => s.directions)
  const profiles      = useProfileStore((s) => s.profiles)

  if (!user || !role) {
    return {
      notifications: [] as NotificationItem[], unreadCount: 0, approvalBadge: 0, isManager: false,
      markRead: () => {}, markAllRead: () => {},
    }
  }

  const roleLevel  = ROLE_ORDER[role] ?? 0
  const isManager  = roleLevel >= ROLE_ORDER.manager
  const today      = todayLocalISO()
  const nowISO     = new Date().toISOString()

  const isAdmin = ADMIN_ROLES.includes(role ?? '')
  const reportingRecords = useReportingStore.getState().reportingRecords
  const reporteeIds = new Set(
    reportingRecords.filter((r) => r.reporting_to_id === user.id).map((r) => r.employee_id)
  )

  const pendingJDsList = jobDirections.filter((d) => {
    if (d.status !== 'submitted') return false
    if (role === 'managing_director' || role === 'executive_assistant') return true
    return d.manager_id === user.id
  })

  const pendingDeletionsList = jobDirections.filter((d) => {
    if (d.status !== 'deletion_requested') return false
    return isAdmin || d.manager_id === user.id
  })

  const pendingTaskChangesList = specialTasks.filter((t) => {
    if (t.approval_status !== 'pending') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  const pendingTaskApprovalsList = specialTasks.filter((t) => {
    if (t.status !== 'In review') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  const approvalBadge = pendingJDsList.length + pendingDeletionsList.length + pendingTaskChangesList.length + pendingTaskApprovalsList.length

  const notifications: NotificationItem[] = []

  specialTasks
    .filter((t) => t.assignees?.some((a) => a.employee_id === user.id) && t.due_date && t.due_date < today && t.status !== 'Completed')
    .slice(0, 3)
    .forEach((t) => {
      notifications.push({
        id: `st_overdue_${t.id}`, type: 'overdue',
        title: 'Overdue task',
        body: `"${t.task_name}" was due on ${t.due_date}`,
        time: t.due_date!, read: readIds.has(`st_overdue_${t.id}`), path: '/tasks',
      })
    })

  pendingJDsList.forEach((d) => {
    const emp = profiles.find((p) => p.id === d.employee_id)
    notifications.push({
      id: `jd_review_${d.id}`, type: 'jd',
      title: 'Job Direction needs review',
      body: `${emp?.full_name ?? 'An employee'} submitted "${d.work_details ?? 'Job Direction'}" for review`,
      time: nowISO, read: readIds.has(`jd_review_${d.id}`), path: '/approval-center',
    })
  })

  pendingDeletionsList.forEach((d) => {
    const emp = profiles.find((p) => p.id === d.employee_id)
    notifications.push({
      id: `jd_del_${d.id}`, type: 'jd',
      title: 'Deletion request',
      body: `${emp?.full_name ?? 'An employee'} requested deletion of "${d.work_details ?? 'Job Direction'}"`,
      time: nowISO, read: readIds.has(`jd_del_${d.id}`), path: '/approval-center',
    })
  })

  pendingTaskChangesList.forEach((t) => {
    const firstAssigneeId = t.assignees?.[0]?.employee_id
    const emp = profiles.find((p) => p.id === firstAssigneeId)
    notifications.push({
      id: `st_change_${t.id}`, type: 'overdue',
      title: 'Task details change',
      body: `${emp?.full_name ?? 'An assignee'} updated details for "${t.task_name}"`,
      time: t.created_at || nowISO, read: readIds.has(`st_change_${t.id}`), path: '/approval-center',
    })
  })

  pendingTaskApprovalsList.forEach((t) => {
    const firstAssigneeId = t.assignees?.[0]?.employee_id
    const emp = profiles.find((p) => p.id === firstAssigneeId)
    notifications.push({
      id: `st_review_${t.id}`, type: 'overdue',
      title: 'Task needs review',
      body: `${emp?.full_name ?? 'An assignee'} completed task "${t.task_name}"`,
      time: t.created_at || nowISO, read: readIds.has(`st_review_${t.id}`), path: '/approval-center',
    })
  })

  notifications.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })
  const unreadCount = notifications.filter((n) => !n.read).length

  function markAllRead() {
    const s = new Set([...readIds, ...notifications.map((n) => n.id)])
    setReadIds(s); localStorage.setItem('notif_read', JSON.stringify([...s]))
  }
  function markRead(id: string) {
    const s = new Set([...readIds, id])
    setReadIds(s); localStorage.setItem('notif_read', JSON.stringify([...s]))
  }

  return { notifications, unreadCount, approvalBadge, isManager, markRead, markAllRead }
}
