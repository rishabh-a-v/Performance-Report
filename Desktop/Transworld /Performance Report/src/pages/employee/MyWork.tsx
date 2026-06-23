import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardTitle } from '@/components/ui/Card'
import { PriorityBadge } from '@/components/ui/StatusBadge'
import { KPICard } from '@/components/ui/KPICard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Avatar } from '@/components/ui/Avatar'
import { TaskProgressDrawer } from '@/components/tasks/TaskProgressDrawer'
import { TaskCreateModal } from '@/components/tasks/TaskCreateModal'
import { ReportBlockerModal } from '@/components/tasks/ReportBlockerModal'
import { useTaskStore } from '@/store/taskStore'
import { useBlockerStore } from '@/store/blockerStore'
import { formatDate, completionRate, formatRelative, cn } from '@/lib/utils'
import { isMeasurable, isValue, progressPct, progressSummary } from '@/lib/kpiEngine'
import { PROFILES } from '@/lib/mockData'
import type { Task, TaskStatus } from '@/types/database'
import {
  Clock, AlertTriangle, TrendingUp, Plus, Calendar, CheckSquare,
  Search, SlidersHorizontal, ArrowUpDown, Eye, MoreHorizontal,
  Share2, ClipboardList, ShieldAlert, CheckCircle2, UserX,
  MessageSquare, Paperclip
} from 'lucide-react'

const STATUS_ORDER: TaskStatus[] = ['backlog', 'ready', 'in_progress', 'blocked', 'done']

const COLUMNS: { label: string; value: TaskStatus; color: string }[] = [
  { label: 'Backlog', value: 'backlog', color: 'border-t-slate-300' },
  { label: 'Ready', value: 'ready', color: 'border-t-indigo-400' },
  { label: 'In Progress', value: 'in_progress', color: 'border-t-blue-500' },
  { label: 'Blocked', value: 'blocked', color: 'border-t-rose-500' },
  { label: 'Done', value: 'done', color: 'border-t-emerald-500' },
]

export function MyWork() {
  const { user } = useAuth()
  const storeTasks = useTaskStore((s) => s.tasks)
  const milestones = useTaskStore((s) => s.milestones)
  const { blockers, resolveBlocker } = useBlockerStore()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [updateTask, setUpdateTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [reportBlockerTask, setReportBlockerTask] = useState<Task | null>(null)
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolveNotes, setResolveNotes] = useState('')

  if (!user) return null

  // All tasks for current user
  const allTasks = storeTasks.filter((t) => t.assignee_id === user.id)

  // Filter tasks based on filters and search
  const filtered = allTasks.filter((task) => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesStatus && matchesSearch
  })

  // KPI Calculations
  const doneCount = allTasks.filter((t) => t.status === 'done').length
  const activeCount = allTasks.filter((t) => t.status === 'in_progress').length
  const blockedCount = allTasks.filter((t) => t.status === 'blocked').length
  const overdueCount = allTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
  ).length
  const rate = completionRate(doneCount, allTasks.length)

  // Blockers current user is causing (they are the blocked_by_user_id)
  const causingBlockers = blockers.filter((b) => b.blocked_by_user_id === user.id && !b.resolved_at)

  function handleResolve(blockerId: string) {
    if (!user) return
    resolveBlocker(blockerId, user.id, resolveNotes)
    setResolvingId(null)
    setResolveNotes('')
  }

  // Toggle single task complete
  const toggleTaskDone = useTaskStore((s) => s.toggleTaskDone)
  const handleCheckboxClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    toggleTaskDone(taskId)
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-700 pb-10">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KPICard title="Total Tasks" value={allTasks.length} icon={ClipboardList} />
        <KPICard title="Completion" value={`${rate}%`} icon={TrendingUp} delta={4.2} iconColor="text-emerald-600" />
        <KPICard title="In Progress" value={activeCount} icon={Clock} iconColor="text-blue-600" />
        <KPICard title="Blocked" value={blockedCount} icon={AlertTriangle} iconColor="text-red-500" invertDelta delta={overdueCount > 0 ? -overdueCount : 0} />
      </div>

      {/* Main Board Card container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Project Header Area */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between bg-slate-50/20">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">WeCraft</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tasks List</p>
          </div>

          {/* Members Avatars List */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5 overflow-hidden">
              {PROFILES.slice(0, 4).map((p) => (
                <div key={p.id} title={p.full_name} className="inline-block ring-2 ring-white rounded-full">
                  <Avatar name={p.full_name} size="sm" />
                </div>
              ))}
              {PROFILES.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 ring-2 ring-white">
                  +{PROFILES.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-white">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Quick Status Filter pills */}
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                All
              </button>
              {COLUMNS.map((col) => (
                <button
                  key={col.value}
                  onClick={() => setStatusFilter(col.value)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors',
                    statusFilter === col.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition-colors shrink-0"
            >
              <Plus size={13} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* View Content (List Only) */}
        <div className="flex-1 p-5 overflow-auto bg-slate-50/30">
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">
                No tasks match the current filter or search.
              </div>
            ) : (
              filtered.map((task) => {
                const isOverdue =
                  task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                const assignee = PROFILES.find((p) => p.id === task.assignee_id)
                const taskMs = milestones.filter((m) => m.task_id === task.id)
                const completedMsCount = taskMs.filter((m) => m.completed).length

                return (
                  <div
                    key={task.id}
                    onClick={() => setUpdateTask(task)}
                    className="group flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
                  >
                    {/* Checkbox and title details */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        onClick={(e) => handleCheckboxClick(e, task.id)}
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          task.status === 'done'
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 bg-white hover:border-emerald-400'
                        )}
                      >
                        {task.status === 'done' && (
                          <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors',
                            task.status === 'done' && 'text-slate-400 line-through'
                          )}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Right attributes section */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap mt-2 sm:mt-0 pl-8 sm:pl-0 text-[10px]">
                      {/* Measurable specific indicator */}
                      {isMeasurable(task) && isValue(task) && (
                        <div className="flex flex-col w-20 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400">
                            {progressSummary(task, milestones)}
                          </span>
                          <ProgressBar value={progressPct(task, milestones)} size="xs" />
                        </div>
                      )}

                      {/* Priority */}
                      <PriorityBadge priority={task.priority} />

                      {/* Due Date */}
                      {task.due_date ? (
                        <span
                          className={cn(
                            'font-semibold rounded px-1.5 py-0.5',
                            isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {formatDate(task.due_date)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}

                      {/* Status Badge */}
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 font-bold uppercase tracking-wide text-[9px]',
                          task.status === 'done' && 'bg-emerald-50 text-emerald-700',
                          task.status === 'in_progress' && 'bg-blue-50 text-blue-700',
                          task.status === 'blocked' && 'bg-rose-50 text-rose-700',
                          task.status === 'ready' && 'bg-indigo-50 text-indigo-700',
                          task.status === 'backlog' && 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {task.status.replace('_', ' ')}
                      </span>

                      {/* Subtask count */}
                      {taskMs.length > 0 && (
                        <span className="flex items-center gap-0.5 text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          <CheckSquare size={10} />
                          {completedMsCount}/{taskMs.length}
                        </span>
                      )}

                      {/* Assignee Avatar */}
                      {assignee && (
                        <div title={assignee.full_name}>
                          <Avatar name={assignee.full_name} size="xs" className="ring-1 ring-slate-100" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer info strip */}
        <div className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-400 font-medium bg-slate-50/30">
          Showing {filtered.length} of {allTasks.length} tasks
        </div>
      </div>

      {/* Blocks I'm Causing Warning Block */}
      {causingBlockers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/20 shadow-sm rounded-2xl p-5">
          <div className="mb-3.5 flex items-center gap-2">
            <ShieldAlert size={15} className="text-orange-600" />
            <CardTitle className="text-orange-800 text-sm font-bold">You're Blocking Someone</CardTitle>
            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 tabular-nums">
              {causingBlockers.length}
            </span>
          </div>
          <div className="space-y-3.5">
            {causingBlockers.map((b) => {
              const blocked = PROFILES.find((p) => p.id === b.employee_id)
              const blockedTask = storeTasks.find((t) => t.id === b.task_id)
              return (
                <div
                  key={b.id}
                  className="rounded-xl border border-orange-200/60 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between shadow-sm"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <UserX size={13} className="text-orange-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800">
                        {blocked?.full_name ?? 'Someone'} is blocked
                      </span>
                      <span className="text-[10px] text-slate-400">· {formatRelative(b.reported_at)}</span>
                    </div>
                    {blockedTask && (
                      <p className="text-[11px] text-slate-500">
                        Task: <span className="font-semibold text-slate-700">{blockedTask.title}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-600 leading-normal">{b.description}</p>
                  </div>

                  <div className="shrink-0 mt-2 sm:mt-0">
                    {resolvingId === b.id ? (
                      <div className="flex flex-col gap-2 w-56">
                        <textarea
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          placeholder="Resolution notes (optional)…"
                          rows={2}
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-slate-300"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolve(b.id)}
                            className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            Confirm Resolved
                          </button>
                          <button
                            onClick={() => {
                              setResolvingId(null)
                              setResolveNotes('')
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(b.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Drawers / Modals */}
      {updateTask && <TaskProgressDrawer task={updateTask} onClose={() => setUpdateTask(null)} />}
      {showCreate && (
        <TaskCreateModal
          currentUserId={user.id}
          defaultDeptId={user.department_id}
          onClose={() => setShowCreate(false)}
        />
      )}
      {reportBlockerTask && (
        <ReportBlockerModal
          task={reportBlockerTask}
          reporterId={user.id}
          onClose={() => setReportBlockerTask(null)}
        />
      )}
    </div>
  )
}
