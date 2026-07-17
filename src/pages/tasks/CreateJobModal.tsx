import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTeamJobStore } from '@/store/teamJobStore'
import { useProfileStore } from '@/store/profileStore'
import { NativeSelect } from '@/components/ui/Select'

export function CreateJobModal({
  onClose,
  allowedProfiles,
}: {
  onClose: () => void
  allowedProfiles: ReturnType<typeof useProfileStore['getState']>['profiles']
}) {
  const { createJob } = useTeamJobStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', head_id: '', due_date: '',
  })
  const [subTasks, setSubTasks] = useState([
    { title: '', task_type: '', assignee_id: '', due_date: '' },
  ])

  function addRow() {
    setSubTasks((s) => [...s, { title: '', task_type: '', assignee_id: '', due_date: '' }])
  }
  function removeRow(i: number) {
    setSubTasks((s) => s.filter((_, idx) => idx !== i))
  }
  function updateRow(i: number, key: string, val: string) {
    setSubTasks((s) => s.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  }

  async function handleSubmit() {
    if (!form.title.trim()) return
    const validTasks = subTasks.filter((t) => t.title.trim() && t.assignee_id)
    setSaving(true)
    await createJob(
      {
        title: form.title.trim(),
        description: form.description.trim() || null,
        head_id: form.head_id || null,
        due_date: form.due_date || null,
      },
      validTasks.map((t) => ({
        title: t.title.trim(),
        task_type: t.task_type.trim() || null,
        assignee_id: t.assignee_id,
        due_date: t.due_date || null,
      })),
    )
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-card shadow-card my-auto">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-lg font-bold text-foreground">New Team Job</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Job details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Site Inspection at Andheri Branch"
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Brief overview of the job..."
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Task Head</label>
                <NativeSelect
                  value={form.head_id}
                  onChange={(e) => setForm((f) => ({ ...f, head_id: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select coordinator</option>
                  {allowedProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Sub-tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sub-tasks</p>
              <button
                onClick={addRow}
                className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-[12px] font-semibold text-muted-foreground hover:bg-muted/70"
              >
                <Plus size={12} /> Add Row
              </button>
            </div>

            <div className="space-y-3">
              {subTasks.map((row, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={row.title}
                      onChange={(e) => updateRow(i, 'title', e.target.value)}
                      placeholder={`Sub-task ${i + 1} title *`}
                      className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {subTasks.length > 1 && (
                      <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-red-500">
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={row.task_type}
                      onChange={(e) => updateRow(i, 'task_type', e.target.value)}
                      placeholder="Type (e.g. Site Survey)"
                      className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <NativeSelect
                      value={row.assignee_id}
                      onChange={(e) => updateRow(i, 'assignee_id', e.target.value)}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Assignee *</option>
                      {allowedProfiles.map((p) => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </NativeSelect>
                    <input
                      type="date"
                      value={row.due_date}
                      onChange={(e) => updateRow(i, 'due_date', e.target.value)}
                      className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.title.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <Plus size={15} />
            {saving ? 'Creating…' : 'Create Team Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
