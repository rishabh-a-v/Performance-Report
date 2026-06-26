import { useState, useRef, useEffect } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColumnDef, Profile, Department, Branch } from '@/types/database'

interface DynamicFormProps {
  schema: ColumnDef[]
  initialData?: Record<string, unknown>
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>
  onCancel: () => void
  currentUserId?: string
  profiles?: Profile[]
  departments?: Department[]
  branches?: Branch[]
  submitLabel?: string
  loading?: boolean
  error?: string | null
}

function initValues(schema: ColumnDef[], initialData: Record<string, unknown>, currentUserId: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const col of schema) {
    if (!col.form) continue
    if (col.form.input_type === 'auto_user') { out[col.key] = currentUserId; continue }
    out[col.key] = initialData[col.key] ?? (col.form.input_type === 'multi_select_profiles' ? [] : '')
  }
  return out
}

// ─── Searchable profile select ─────────────────────────────────────────────────

function ProfileSelect({
  value, onChange, profiles, placeholder = 'Select employee', allowNone = false,
}: {
  value: string
  onChange: (id: string) => void
  profiles: Profile[]
  placeholder?: string
  allowNone?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = profiles.find((p) => p.id === value)

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = search.trim()
    ? profiles.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()))
    : profiles

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch('') }}
        className="flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-300"
      >
        <span className="truncate text-left">{selected ? selected.full_name : <span className="text-slate-400">{placeholder}</span>}</span>
        <ChevronDown size={14} className="ml-2 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-[200] mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <Search size={12} className="text-slate-400 shrink-0" />
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…" className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none" />
              {search && <button type="button" onClick={() => setSearch('')}><X size={11} className="text-slate-400" /></button>}
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {allowNone && (
              <button type="button" onClick={() => { onChange(''); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:bg-slate-50">— None —</button>
            )}
            {filtered.length === 0
              ? <p className="px-3 py-3 text-sm text-slate-400 text-center">No results.</p>
              : filtered.map((p) => (
                <button key={p.id} type="button"
                  onClick={() => { onChange(p.id); setOpen(false); setSearch('') }}
                  className={cn('w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors', p.id === value && 'bg-blue-50 text-blue-700 font-medium')}>
                  {p.full_name} <span className="text-slate-400 text-xs">— {p.role}</span>
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Multi-profile select ──────────────────────────────────────────────────────

function MultiProfileSelect({
  value, onChange, profiles,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  profiles: Profile[]
}) {
  const [search, setSearch] = useState('')
  const filtered = search.trim()
    ? profiles.filter((p) => p.full_name.toLowerCase().includes(search.toLowerCase()))
    : profiles

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  }

  return (
    <div>
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 mb-1.5">
        <Search size={12} className="text-slate-400 shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees…" className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none" />
        {search && <button type="button" onClick={() => setSearch('')}><X size={11} className="text-slate-400" /></button>}
      </div>
      <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-50">
        {filtered.map((p) => (
          <label key={p.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm">
            <input type="checkbox" checked={value.includes(p.id)} onChange={() => toggle(p.id)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-300" />
            <span className="text-slate-700">{p.full_name}</span>
            <span className="text-slate-400 text-xs ml-auto">{p.role}</span>
          </label>
        ))}
      </div>
      {value.length > 0 && (
        <p className="mt-1 text-xs text-blue-600 font-medium">{value.length} selected</p>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

const fieldClass = 'mt-1 block w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-300 transition-colors'

export function DynamicForm({
  schema,
  initialData = {},
  onSubmit,
  onCancel,
  currentUserId = '',
  profiles = [],
  departments = [],
  branches = [],
  submitLabel = 'Save',
  loading = false,
  error = null,
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(
    () => initValues(schema, initialData, currentUserId)
  )

  function set(key: string, val: unknown) {
    setValues((v) => ({ ...v, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(values)
  }

  const formFields = schema.filter((c) => c.form && c.form.input_type !== 'auto_user')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formFields.map((col) => {
        const f = col.form!
        const val = values[col.key]

        return (
          <div key={col.key}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {col.label}{f.required && <span className="ml-0.5 text-red-500">*</span>}
            </label>

            {f.input_type === 'textarea' && (
              <textarea
                value={(val as string) ?? ''}
                onChange={(e) => set(col.key, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                rows={3}
                className={fieldClass}
              />
            )}

            {(f.input_type === 'text' || f.input_type === 'email' || f.input_type === 'tel') && (
              <input
                type={f.input_type}
                value={(val as string) ?? ''}
                onChange={(e) => set(col.key, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                className={fieldClass}
              />
            )}

            {f.input_type === 'number' && (
              <input
                type="number"
                value={(val as string) ?? ''}
                onChange={(e) => set(col.key, e.target.value)}
                placeholder={f.placeholder ?? '0'}
                className={fieldClass}
              />
            )}

            {f.input_type === 'date' && (
              <input
                type="date"
                value={(val as string) ?? ''}
                onChange={(e) => set(col.key, e.target.value || null)}
                required={f.required}
                className={fieldClass}
              />
            )}

            {f.input_type === 'select' && !f.source && (
              <select
                value={(val as string) ?? ''}
                onChange={(e) => set(col.key, e.target.value)}
                required={f.required}
                className={fieldClass}
              >
                {!f.required && <option value="">— Select —</option>}
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {f.input_type === 'select' && f.source === 'branches' && (
              <select value={(val as string) ?? ''} onChange={(e) => set(col.key, e.target.value)} required={f.required} className={fieldClass}>
                <option value="">— Select Branch —</option>
                {branches.map((b) => <option key={b.id} value={b.code}>{b.name} ({b.code})</option>)}
              </select>
            )}

            {f.input_type === 'select' && f.source === 'departments' && (
              <select value={(val as string) ?? ''} onChange={(e) => set(col.key, e.target.value)} required={f.required} className={fieldClass}>
                <option value="">— Select Department —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}

            {f.input_type === 'select_profile' && (
              <ProfileSelect
                value={(val as string) ?? ''}
                onChange={(id) => set(col.key, id)}
                profiles={profiles}
                placeholder={`Select ${col.label.toLowerCase()}…`}
                allowNone={!f.required}
              />
            )}

            {f.input_type === 'multi_select_profiles' && (
              <MultiProfileSelect
                value={(val as string[]) ?? []}
                onChange={(ids) => set(col.key, ids)}
                profiles={profiles}
              />
            )}
          </div>
        )
      })}

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
