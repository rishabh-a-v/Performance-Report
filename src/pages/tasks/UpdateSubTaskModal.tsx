import { useState } from 'react'
import { X, Circle, Clock, CheckCircle2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamJobTask, TeamTaskStatus } from '@/types/database'

export function UpdateSubTaskModal({
  task,
  onClose,
  onSave,
}: {
  task: TeamJobTask
  onClose: () => void
  onSave: (status: TeamTaskStatus, notes: string) => Promise<void>
}) {
  const [status, setStatus] = useState<TeamTaskStatus>(task.status)
  const [notes, setNotes]   = useState(task.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(status, notes)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-card shadow-card max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-base font-bold text-foreground">Update Sub-task</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Sub-task</p>
            <p className="text-sm font-medium text-foreground">{task.title}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Status</p>
            <div className="flex flex-col gap-2">
              {(['Yet to start', 'In progress', 'Completed'] as TeamTaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left',
                    status === s
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-border hover:bg-muted',
                  )}
                >
                  {s === 'Yet to start' && <Circle size={15} className="shrink-0" />}
                  {s === 'In progress'  && <Clock size={15} className="shrink-0 text-blue-500" />}
                  {s === 'Completed'    && <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />}
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Notes / Updates</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Describe progress, blockers, or findings..."
              className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
