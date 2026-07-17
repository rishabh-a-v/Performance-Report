import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSpecialTaskStore } from '@/store/specialTaskStore'
import { useProfileStore } from '@/store/profileStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Dialog'
import { PRIORITY_STYLES, PRIORITY_LABELS } from './taskViewModel'
import type { TaskPriority } from '@/types/database'

interface AddTaskModalProps {
  open: boolean
  onClose: () => void
  defaultAssigneeId?: string
}

export function AddTaskModal({ open, onClose, defaultAssigneeId }: AddTaskModalProps) {
  const { user } = useAuth()
  const { addTask } = useSpecialTaskStore()
  const [taskName, setTaskName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [assigneeSearch, setAssigneeSearch] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const profiles = useProfileStore((s) => s.profiles)
  const assigneeOptions = (() => {
    if (!user) return []
    if (user.role === 'managing_director' || user.role === 'executive_assistant') {
      return profiles
    }
    if (user.role === 'director') {
      const deptMembers = profiles.filter((p) => p.department_id === user.department_id)
      return [user, ...deptMembers.filter((p) => p.id !== user.id)]
    }
    const directReports = profiles.filter((p) => p.manager_id === user.id)
    return [user, ...directReports.filter((p) => p.id !== user.id)]
  })()

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
    setError('')
  }

  async function handleSubmit() {
    if (!taskName.trim()) { setError('Task name is required.'); return }
    if (assigneeIds.length === 0) { setError('Select at least one assignee.'); return }

    setSubmitting(true)
    const isSelfOnly = assigneeIds.length === 1 && assigneeIds[0] === user?.id
    const errMsg = await addTask({
      task_name: taskName.trim(),
      remarks: remarks.trim() || null,
      assigned_by: user?.id ?? '',
      due_date: dueDate || null,
      status: isSelfOnly ? 'In progress' : 'Yet to start',
      priority,
    }, assigneeIds)
    setSubmitting(false)

    if (errMsg) {
      setError(`Failed to create task: ${errMsg}`)
      return
    }

    // Reset
    setTaskName('')
    setDueDate('')
    setRemarks('')
    setPriority('medium')
    setAssigneeIds([])
    onClose()
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      onClose()
      setTaskName('')
      setDueDate('')
      setRemarks('')
      setPriority('medium')
      setAssigneeIds(defaultAssigneeId ? [defaultAssigneeId] : (user?.id ? [user.id] : []))
      setAssigneeSearch('')
      setError('')
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <Input
            id="st-title"
            label="Task Name *"
            placeholder="e.g. Prepare monthly report"
            value={taskName}
            onChange={(e) => { setTaskName(e.target.value); setError('') }}
            error={error && !taskName.trim() ? error : ''}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-foreground/70">
              Assignees * <span className="text-muted-foreground font-normal">({assigneeIds.length} selected)</span>
            </label>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-muted px-2.5 py-1.5">
                <Search size={13} className="shrink-0 text-muted-foreground" />
                <input
                  value={assigneeSearch}
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {assigneeSearch && (
                  <button type="button" onClick={() => setAssigneeSearch('')}>
                    <X size={12} className="text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-border bg-muted">
                {assigneeOptions
                  .filter((p) => !assigneeSearch.trim() || p.full_name.toLowerCase().includes(assigneeSearch.toLowerCase()))
                  .map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={assigneeIds.includes(p.id)}
                        onChange={() => toggleAssignee(p.id)}
                        className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <Avatar name={p.full_name} size="xs" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {p.full_name}
                          {p.id === user?.id && <span className="ml-1 text-muted-foreground font-normal">(me)</span>}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{p.role}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>
            {error && assigneeIds.length === 0 && (
              <p className="text-xs text-red-500">{error}</p>
            )}
          </div>

          <Input
            id="st-due"
            label="Due Date (optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Textarea
            id="st-remarks"
            label="Remarks"
            placeholder="Add notes or details..."
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground/70">Priority</label>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex-1 rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors',
                    priority === p
                      ? cn(PRIORITY_STYLES[p], 'border-transparent')
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && error.startsWith('Failed') && (
          <p className="text-xs text-red-600 font-medium px-1">{error}</p>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
