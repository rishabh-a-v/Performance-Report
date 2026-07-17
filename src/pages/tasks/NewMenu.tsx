import { useEffect, useRef, useState } from 'react'
import { Plus, CheckSquare, Users, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

/**
 * Single "New" action. If the user may create both a task and a team job it
 * renders a small menu; with one permission it's a plain button; with none it
 * renders nothing.
 */
export function NewMenu({
  canCreateTask,
  canCreateJob,
  onNewTask,
  onNewJob,
}: {
  canCreateTask: boolean
  canCreateJob: boolean
  onNewTask: () => void
  onNewJob: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (!canCreateTask && !canCreateJob) return null

  if (canCreateTask !== canCreateJob) {
    const single = canCreateTask
      ? { label: 'New Task', onClick: onNewTask }
      : { label: 'New Team Job', onClick: onNewJob }
    return (
      <Button size="sm" onClick={single.onClick}>
        <Plus size={14} /> {single.label}
      </Button>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <Button size="sm" onClick={() => setOpen((v) => !v)}>
        <Plus size={14} /> New <ChevronDown size={13} className="opacity-70" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-44 rounded-xl border border-border bg-card shadow-card p-1">
          <button
            onClick={() => { setOpen(false); onNewTask() }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <CheckSquare size={14} className="text-muted-foreground" /> Task
          </button>
          <button
            onClick={() => { setOpen(false); onNewJob() }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Users size={14} className="text-muted-foreground" /> Team Job
          </button>
        </div>
      )}
    </div>
  )
}
