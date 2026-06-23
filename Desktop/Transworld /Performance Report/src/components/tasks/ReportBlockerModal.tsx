import { useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { useBlockerStore } from '@/store/blockerStore'
import { PROFILES } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/database'

interface Props {
  task: Task
  reporterId: string
  onClose: () => void
}

export function ReportBlockerModal({ task, reporterId, onClose }: Props) {
  const { addBlocker } = useBlockerStore()

  const [blockedById, setBlockedById] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const others = PROFILES.filter((p) => p.id !== reporterId && p.is_active)

  function handleSubmit() {
    if (!description.trim()) { setSubmitted(true); return }
    addBlocker({
      employee_id: reporterId,
      task_id: task.id,
      description: description.trim(),
      reported_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null,
      resolution_notes: null,
      hours_blocked: 0,
      blocked_by_user_id: blockedById || null,
    })
    onClose()
  }

  const selectedBlocker = others.find((p) => p.id === blockedById)

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 rounded-2xl flex flex-col">
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-6 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle size={15} className="text-red-600" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Report Blocker</h2>
            <p className="text-xs text-slate-400 truncate max-w-[260px]">{task.title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          {/* Who blocked you */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Who is blocking you? <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <select
                value={blockedById}
                onChange={(e) => setBlockedById(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                <option value="">— Select a person —</option>
                {others.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name} · {p.designation}</option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {selectedBlocker && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-200 text-xs font-bold text-orange-700">
                  {selectedBlocker.full_name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orange-800">{selectedBlocker.full_name}</p>
                  <p className="text-[10px] text-orange-500">{selectedBlocker.designation} · {selectedBlocker.department_id}</p>
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              What is blocking you? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setSubmitted(false) }}
              placeholder="Describe the blocker — what's preventing progress on this task?"
              rows={4}
              className={cn(
                'w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-colors',
                submitted && !description.trim() ? 'border-red-400' : 'border-slate-200',
              )}
            />
            {submitted && !description.trim() && (
              <p className="mt-1 text-xs text-red-500">Please describe the blocker.</p>
            )}
          </div>

          {/* Info note */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              {selectedBlocker
                ? <>This blocker will be visible to <strong>{selectedBlocker.full_name}</strong>, who can resolve it once the issue is fixed.</>
                : <>This blocker will be reported to your manager, who can track and resolve it.</>
              }
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Report Blocker
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
