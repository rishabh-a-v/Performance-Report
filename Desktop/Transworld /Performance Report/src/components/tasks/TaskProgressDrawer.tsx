import { useState } from 'react'
import {
  X, Calendar, CheckSquare, Paperclip, MessageSquare, Plus,
  ChevronsUpDown, Trash2, CheckCircle2, ChevronRight, ChevronDown, Flag,
  Clock, Download
} from 'lucide-react'
import { useTaskStore } from '@/store/taskStore'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn, formatDate } from '@/lib/utils'
import { PROFILES } from '@/lib/mockData'
import type { Task, Milestone, TaskPriority, TaskStatus } from '@/types/database'

interface Props {
  task: Task
  onClose: () => void
}

export function TaskProgressDrawer({ task, onClose }: Props) {
  const { updateTask, toggleMilestone, addMilestones, milestones: allMilestones } = useTaskStore()
  const { user } = useAuth()

  // Get milestones/subtasks for this task
  const taskMs = allMilestones.filter((m) => m.task_id === task.id).sort((a, b) => a.sort_order - b.sort_order)
  const completedMsCount = taskMs.filter((m) => m.completed).length

  // Component UI state
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [isDescFocused, setIsDescFocused] = useState(false)
  const [subtasksOpen, setSubtasksOpen] = useState(true)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showAddSubtask, setShowAddSubtask] = useState(false)

  // Mock comments
  const [comments, setComments] = useState<{ id: string; author: string; avatar: string; text: string; date: string }[]>([
    { id: 'c1', author: 'Michele Jordan', avatar: 'Michele Jordan', text: 'Logo drafts are looking good, we need to focus on a modern sans-serif font.', date: 'Feb 4, 2026' },
    { id: 'c2', author: 'Vikram Joshi', avatar: 'Vikram Joshi', text: 'Make sure the icons are scalable for mobile and desktop screens.', date: 'Feb 5, 2026' }
  ])
  const [newComment, setNewComment] = useState('')

  // Mock attachments
  const [attachments, setAttachments] = useState<{ id: string; name: string; size: string }[]>([
    { id: 'a1', name: 'Inspirations.zip', size: '5.8 MB' }
  ])

  // Save description change
  const handleSaveDescription = () => {
    updateTask(task.id, { description })
    setIsDescFocused(false)
  }

  // Cancel description change
  const handleCancelDescription = () => {
    setDescription(task.description ?? '')
    setIsDescFocused(false)
  }

  // Toggle complete checkbox
  const handleToggleTaskComplete = () => {
    const newStatus: TaskStatus = task.status === 'done' ? 'in_progress' : 'done'
    updateTask(task.id, {
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    })
  }

  // Add new subtask/milestone
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubtaskTitle.trim()) return

    const newCount = taskMs.length + 1
    const baseWeight = Math.floor(100 / newCount)
    const remainder = 100 - (baseWeight * (newCount - 1))

    // Re-balance existing milestones
    taskMs.forEach((m, idx) => {
      m.weight = baseWeight
    })

    const newMs: Milestone = {
      id: `ms_live_${Date.now()}`,
      task_id: task.id,
      title: newSubtaskTitle.trim(),
      weight: remainder,
      completed: false,
      completed_at: null,
      sort_order: newCount,
      created_at: new Date().toISOString()
    }

    addMilestones([newMs])
    setNewSubtaskTitle('')
    setShowAddSubtask(false)
  }

  // Add a comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const newC = {
      id: `c_${Date.now()}`,
      author: user?.full_name ?? 'Demo User',
      avatar: user?.full_name ?? 'Demo User',
      text: newComment.trim(),
      date: 'Just now'
    }
    setComments([...comments, newC])
    setNewComment('')
  }

  // Add simulated attachment
  const handleAddAttachment = () => {
    const newA = {
      id: `att_${Date.now()}`,
      name: 'Design_Proposal_V2.pdf',
      size: '2.4 MB'
    }
    setAttachments([...attachments, newA])
  }

  // Remove attachment
  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative flex w-full max-w-4xl h-[85vh] flex-col rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-slide-in">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Your Projects</span>
            <span>/</span>
            <span className="flex items-center gap-0.5">
              <span className="text-[10px]">㗊</span> WeCraft
            </span>
            <span>/</span>
            <span className="font-semibold text-slate-600 capitalize">
              {task.status.replace('_', ' ')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal Columns */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Column (Main Details - 65%) */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {/* Title with checkbox */}
            <div className="flex items-start gap-3">
              <button
                onClick={handleToggleTaskComplete}
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all mt-1',
                  task.status === 'done'
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white hover:border-emerald-400',
                )}
              >
                {task.status === 'done' && (
                  <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  updateTask(task.id, { title: e.target.value })
                }}
                className={cn(
                  'w-full bg-transparent text-xl font-bold text-slate-800 focus:outline-none focus:border-b focus:border-slate-200 pb-1',
                  task.status === 'done' && 'text-slate-400 line-through'
                )}
                placeholder="Task Title"
              />
            </div>

            {/* Description Editor */}
            <div className="space-y-2">
              <textarea
                value={description}
                onFocus={() => setIsDescFocused(true)}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a detailed description here..."
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-200"
              />
              {isDescFocused && (
                <div className="flex justify-end gap-2 animate-fade-in">
                  <button
                    onClick={handleCancelDescription}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible Subtasks / Milestones Checklist */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <button
                onClick={() => setSubtasksOpen(!subtasksOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900"
              >
                {subtasksOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Subtasks</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {completedMsCount}/{taskMs.length}
                </span>
              </button>

              {subtasksOpen && (
                <div className="pl-5 space-y-2">
                  {taskMs.map((ms) => (
                    <div
                      key={ms.id}
                      className="group flex items-center justify-between rounded-lg hover:bg-slate-50/80 px-2 py-1.5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => toggleMilestone(ms.id)}
                          className={cn(
                            'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-all',
                            ms.completed
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300 bg-white hover:border-emerald-400',
                          )}
                        >
                          {ms.completed && (
                            <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        <span className={cn(
                          'text-xs font-medium text-slate-700 truncate',
                          ms.completed && 'line-through text-slate-400'
                        )}>
                          {ms.title}
                        </span>
                      </div>
                      {/* Subtask actions (delete) */}
                      <button
                        onClick={() => toggleMilestone(ms.id)}
                        className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Add Subtask form inline */}
                  {showAddSubtask ? (
                    <form onSubmit={handleAddSubtask} className="flex gap-2 items-center mt-2 pl-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Subtask title..."
                        className="flex-1 rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddSubtask(false)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddSubtask(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 pl-2 mt-1"
                    >
                      <Plus size={11} />
                      <span>Add Subtask</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Attachment</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                {attachments.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-400">
                        <Paperclip size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-700">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{file.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="rounded p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600">
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => handleRemoveAttachment(file.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddAttachment}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 pl-2 mt-1"
              >
                <Plus size={11} />
                <span>Add Attachment</span>
              </button>
            </div>

            {/* Comments Feed */}
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-700">Comments</h4>

              {/* Feed items */}
              <div className="space-y-4 pl-2">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar name={c.author} size="sm" className="ring-1 ring-slate-100 shrink-0 mt-0.5" />
                    <div className="space-y-1 bg-slate-50/50 rounded-xl px-3 py-2 border border-slate-100/60 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{c.author}</span>
                        <span className="text-[10px] text-slate-400">{c.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-normal">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment box */}
              <form onSubmit={handleAddComment} className="flex gap-3 items-start pl-2 pt-2">
                <Avatar name={user?.full_name ?? 'Demo User'} size="sm" className="ring-1 ring-slate-100 mt-1" />
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Post Comment
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (Sidebar Metadata Panel - 35%) */}
          <div className="w-[300px] border-l border-slate-200 bg-slate-50/30 px-6 py-6 overflow-y-auto space-y-5">
            {/* Created By */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Created by</span>
              <div className="flex items-center gap-2">
                <Avatar name="Michele Jordan" size="sm" className="ring-1 ring-slate-200" />
                <span className="text-xs font-semibold text-slate-700">Michele Jordan</span>
              </div>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assignee</span>
              <div className="relative">
                <select
                  value={task.assignee_id}
                  onChange={(e) => updateTask(task.id, { assignee_id: e.target.value })}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
                >
                  {PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.designation})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronsUpDown size={11} />
                </div>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date</span>
              <div className="relative">
                <input
                  type="date"
                  value={task.due_date ? task.due_date.slice(0, 10) : ''}
                  onChange={(e) => updateTask(task.id, { due_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
                />
              </div>
            </div>

            {/* Set Priority */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Set Priority</span>
              <div className="relative">
                <select
                  value={task.priority}
                  onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-300 cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Urgent</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Flag
                    size={12}
                    className={cn(
                      task.priority === 'critical' && 'text-red-500 fill-red-500',
                      task.priority === 'high' && 'text-orange-500 fill-orange-500',
                      task.priority === 'medium' && 'text-yellow-500 fill-yellow-500',
                      task.priority === 'low' && 'text-slate-400 fill-slate-400'
                    )}
                  />
                </div>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <ChevronsUpDown size={11} />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tags</span>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 uppercase tracking-wide"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    {t}
                  </span>
                ))}
                {/* Form inline to add a tag */}
                <button
                  onClick={() => {
                    const newTag = prompt('Enter tag name:')
                    if (newTag?.trim()) {
                      updateTask(task.id, { tags: [...task.tags, newTag.trim()] })
                    }
                  }}
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-400"
                >
                  <Plus size={10} />
                  Add tag
                </button>
              </div>
            </div>

            {/* Timestamps logs */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-[10px] text-slate-400 font-medium">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{task.created_at ? formatDate(task.created_at) : 'Feb 2, 2026 4:30 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{task.updated_at ? formatDate(task.updated_at) : 'Feb 2, 2026 4:55 PM'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
