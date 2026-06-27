import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, CheckSquare, Clock, X,
  ChevronDown, LogOut, Menu, ShieldCheck,
  UserPlus, Users, Network,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useJobDirectionStore } from '@/store/jobDirectionStore'
import { useProfileStore } from '@/store/profileStore'

interface NotificationItem {
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

export function TopBar() {
  const { user, role, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [notifOpen,   setNotifOpen]   = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('notif_read') ?? '[]')) } catch { return new Set() }
  })

  const notifRef   = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const specialTasks  = useSpecialTaskStore((s) => s.tasks)
  const jobDirections = useJobDirectionStore((s) => s.directions)
  const profiles      = useProfileStore((s) => s.profiles)

  useEffect(() => {
    setNotifOpen(false); setProfileOpen(false); setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handle(e: MouseEvent) {
      const t = e.target as Node
      if (notifRef.current   && !notifRef.current.contains(t))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  if (!user || !role) return null

  const roleLevel  = ROLE_ORDER[role] ?? 0
  const isManager  = roleLevel >= ROLE_ORDER.manager
  const today      = new Date().toISOString().slice(0, 10)

  // ── Badge counts & lists ───────────────────────────────────────────────────
  const isAdmin = ADMIN_ROLES.includes(role ?? '')
  const reporteeIds = new Set(profiles.filter((p) => p.manager_id === user.id).map((p) => p.id))

  // 1. Submitted Job Directions
  const pendingJDsList = jobDirections.filter((d) => {
    if (d.status !== 'submitted') return false
    if (role === 'managing_director' || role === 'executive_assistant') return true
    return d.manager_id === user.id
  })

  // 2. Deletion Requests for Job Directions
  const pendingDeletionsList = jobDirections.filter((d) => {
    if (d.status !== 'deletion_requested') return false
    return isAdmin || d.manager_id === user.id
  })

  // 3. Task detail changes
  const pendingTaskChangesList = specialTasks.filter((t) => {
    if (t.approval_status !== 'pending') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  // 4. Tasks completed/submitted for review
  const pendingTaskApprovalsList = specialTasks.filter((t) => {
    if (t.status !== 'In review') return false
    const assigneeIds = t.assignees?.map((a) => a.employee_id) ?? []
    if (isAdmin) return true
    return assigneeIds.some((id) => reporteeIds.has(id))
  })

  const approvalBadge = pendingJDsList.length + pendingDeletionsList.length + pendingTaskChangesList.length + pendingTaskApprovalsList.length

  // ── Notifications ───────────────────────────────────────────────────────────
  const notifications: NotificationItem[] = []

  // 1. Overdue Tasks (Assignees see their own overdue tasks)
  specialTasks
    .filter((t) => t.assignees?.some((a) => a.employee_id === user.id) && t.due_date && t.due_date < today && t.status !== 'Completed')
    .slice(0, 3)
    .forEach((t) => {
      notifications.push({
        id: `st_overdue_${t.id}`, type: 'overdue',
        title: 'Overdue task',
        body: `"${t.task_name}" was due on ${t.due_date}`,
        time: t.due_date!, read: readIds.has(`st_overdue_${t.id}`), path: '/special-tasks',
      })
    })

  // 2. Submitted Job Directions review notifications for manager/MD/EA
  pendingJDsList.forEach((d) => {
    const emp = profiles.find((p) => p.id === d.employee_id)
    notifications.push({
      id: `jd_review_${d.id}`, type: 'jd',
      title: 'Job Direction needs review',
      body: `${emp?.full_name ?? 'An employee'} submitted "${d.work_details ?? 'Job Direction'}" for review`,
      time: today, read: readIds.has(`jd_review_${d.id}`), path: '/approval-center',
    })
  })

  // 3. Deletion requests review notifications for manager/Admin
  pendingDeletionsList.forEach((d) => {
    const emp = profiles.find((p) => p.id === d.employee_id)
    notifications.push({
      id: `jd_del_${d.id}`, type: 'jd',
      title: 'Deletion request',
      body: `${emp?.full_name ?? 'An employee'} requested deletion of "${d.work_details ?? 'Job Direction'}"`,
      time: today, read: readIds.has(`jd_del_${d.id}`), path: '/approval-center',
    })
  })

  // 4. Task detail changes review notifications for manager/Admin
  pendingTaskChangesList.forEach((t) => {
    const firstAssigneeId = t.assignees?.[0]?.employee_id
    const emp = profiles.find((p) => p.id === firstAssigneeId)
    notifications.push({
      id: `st_change_${t.id}`, type: 'overdue',
      title: 'Task details change',
      body: `${emp?.full_name ?? 'An assignee'} updated details for "${t.task_name}"`,
      time: t.created_at || today, read: readIds.has(`st_change_${t.id}`), path: '/approval-center',
    })
  })

  // 5. Task completion review notifications for manager/Admin
  pendingTaskApprovalsList.forEach((t) => {
    const firstAssigneeId = t.assignees?.[0]?.employee_id
    const emp = profiles.find((p) => p.id === firstAssigneeId)
    notifications.push({
      id: `st_review_${t.id}`, type: 'overdue',
      title: 'Task needs review',
      body: `${emp?.full_name ?? 'An assignee'} completed task "${t.task_name}"`,
      time: t.created_at || today, read: readIds.has(`st_review_${t.id}`), path: '/approval-center',
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
  function handleNotifClick(n: NotificationItem) {
    markRead(n.id); setNotifOpen(false); navigate(n.path)
  }

  const notifIcon = (t: NotificationItem['type']) => {
    if (t === 'overdue')  return <Clock size={13} className="text-orange-500" />
    return <CheckSquare size={13} className="text-blue-500" />
  }
  const notifDot = (t: NotificationItem['type']) => {
    if (t === 'overdue')  return 'bg-orange-100'
    return 'bg-blue-100'
  }

  // ── Nav link class ──────────────────────────────────────────────────────────
  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      'px-4 py-2.5 rounded-md text-[15px] font-medium transition-colors whitespace-nowrap',
      isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50',
    )

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-5 lg:px-8">

        {/* ── Left: Logo + Desktop Nav ───────────────────────────────────── */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/overview')}
            className="mr-6 shrink-0 transition-opacity hover:opacity-80"
          >
            <img src="/ti-logo.png" alt="TransWorld International" className="h-9 w-auto" />
          </button>

          <nav className="hidden items-center gap-0.5 lg:flex">
            <NavLink to="/overview"       className={navLink}>Overview</NavLink>
            <NavLink to="/job-directions" className={navLink}>Job Directions</NavLink>
            <NavLink to="/special-tasks"  className={navLink}>Tasks</NavLink>
            <NavLink to="/calendar"       className={navLink}>Calendar</NavLink>

            {/* Approvals — managers+ */}
            {isManager && (
              <NavLink
                to="/approval-center"
                className={({ isActive }) => cn(
                  navLink({ isActive }),
                  'flex items-center gap-1.5',
                )}
              >
                Approvals
                {approvalBadge > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 tabular-nums">
                    {approvalBadge}
                  </span>
                )}
              </NavLink>
            )}

          </nav>

            {/* Add Employee + Manage Employees — MD, EA, HR, Director */}
            {(['managing_director', 'executive_assistant', 'hr', 'director'] as readonly string[]).includes(role ?? '') && (
              <div className="ml-2 hidden xl:flex items-center gap-1.5">
                <button
                  onClick={() => navigate('/add-employee')}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-indigo-700 whitespace-nowrap"
                >
                  + Add Employee
                </button>
                <NavLink
                  to="/manage-employees"
                  className={({ isActive }) => cn(
                    'px-4 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap border',
                    isActive
                      ? 'bg-slate-100 text-slate-900 border-slate-200'
                      : 'text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50',
                  )}
                >
                  Manage Employees
                </NavLink>
              </div>
            )}

        </div>

        {/* ── Right: Notifications + Profile + Mobile toggle ──────────────── */}
        <div className="flex items-center gap-1">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
              className={cn(
                'relative rounded-lg p-2.5 transition-colors',
                notifOpen ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
              )}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Bell size={13} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">{unreadCount} new</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                      <Bell size={24} className="opacity-30" />
                      <p className="text-xs font-medium">You're all caught up!</p>
                    </div>
                  ) : notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50', !n.read && 'bg-blue-50/40')}
                    >
                      <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', notifDot(n.type))}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-xs font-semibold text-slate-800 leading-snug', n.read && 'font-medium text-slate-600')}>{n.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-snug line-clamp-2">{n.body}</p>
                      </div>
                      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>

                {notifications.length > 0 && (
                  <div className="border-t border-slate-100 px-4 py-2.5">
                    <p className="text-center text-[10px] text-slate-400 font-medium">
                      Showing {notifications.length} recent notifications
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
              className="ml-2 flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-slate-100"
            >
              <Avatar name={user.full_name} size="sm" className="ring-1 ring-slate-200" />
              <div className="hidden text-left sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user.full_name}</p>
                <p className="text-xs text-slate-400 leading-tight capitalize">{role.replace('_', ' ')}</p>
              </div>
              <ChevronDown size={15} className={cn('text-slate-400 transition-transform hidden sm:block', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{role.replace('_', ' ')}</p>
                </div>
                <div className="py-1">
                  {((['managing_director', 'executive_assistant', 'hr', 'director'] as readonly string[]).includes(role ?? '')) && (
                    <>
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/add-employee') }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserPlus size={16} className="shrink-0 text-indigo-500" />
                        Add Employee
                      </button>
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/manage-employees') }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Users size={16} className="shrink-0 text-indigo-500" />
                        Manage Employees
                      </button>
                    </>
                  )}
                  {ADMIN_ROLES.includes(role ?? '') && (
                    <>
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/admin/org-chart') }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Network size={16} className="shrink-0 text-indigo-500" />
                        Org Chart
                      </button>
                      <button
                        onClick={() => { setProfileOpen(false); navigate('/admin/role-permissions') }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <ShieldCheck size={16} className="shrink-0 text-indigo-500" />
                        Role Permissions
                      </button>
                    </>
                  )}
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-[15px] text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="ml-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile nav ─────────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            <NavLink to="/overview"       className={navLink}>Overview</NavLink>
            <NavLink to="/job-directions" className={navLink}>Job Directions</NavLink>
            <NavLink to="/special-tasks"  className={navLink}>Tasks</NavLink>
            <NavLink to="/calendar"       className={navLink}>Calendar</NavLink>
            {isManager && (
              <NavLink to="/approval-center" className={navLink}>
                Approvals {approvalBadge > 0 && `(${approvalBadge})`}
              </NavLink>
            )}
            {(['managing_director', 'executive_assistant', 'hr', 'director'] as readonly string[]).includes(role ?? '') && (
              <>
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => { setMobileOpen(false); navigate('/add-employee') }}
                  className={navLink({ isActive: false })}
                >
                  + Add Employee
                </button>
                <NavLink to="/manage-employees" className={navLink}>
                  Manage Employees
                </NavLink>
                {ADMIN_ROLES.includes(role ?? '') && (
                  <>
                    <NavLink to="/admin/org-chart" className={navLink}>Org Chart</NavLink>
                    <NavLink to="/admin/role-permissions" className={navLink}>Role Permissions</NavLink>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
