import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import type { ColumnDef, CellType, Profile, Department } from '@/types/database'

// ─── Status colours ───────────────────────────────────────────────────────────

const TASK_STATUS_COLORS: Record<string, string> = {
  'Yet to start': 'bg-slate-100 text-slate-500',
  'In progress':  'bg-blue-100 text-blue-700',
  'Completed':    'bg-emerald-100 text-emerald-700',
  'Cancelled':    'bg-red-100 text-red-600',
  'Acknowledged': 'bg-teal-100 text-teal-700',
}

const JD_STATUS_COLORS: Record<string, string> = {
  draft:              'bg-slate-100 text-slate-500',
  active:             'bg-blue-100 text-blue-700',
  submitted:          'bg-amber-100 text-amber-700',
  approved:           'bg-emerald-100 text-emerald-700',
  rejected:           'bg-red-100 text-red-700',
  completed:          'bg-slate-100 text-slate-600',
  deletion_requested: 'bg-red-100 text-red-700',
}

const JD_STATUS_LABELS: Record<string, string> = {
  draft:              'Draft',
  active:             'Active',
  submitted:          'Under Review',
  approved:           'Approved',
  rejected:           'Changes Needed',
  completed:          'Completed',
  deletion_requested: 'Deletion Pending',
}

const ROLE_COLORS: Record<string, string> = {
  managing_director:  'bg-purple-100 text-purple-700',
  executive_assistant:'bg-indigo-100 text-indigo-700',
  hr:                 'bg-pink-100 text-pink-700',
  director:           'bg-blue-100 text-blue-700',
  manager:            'bg-teal-100 text-teal-700',
  executive:          'bg-slate-100 text-slate-600',
}
const ROLE_LABELS: Record<string, string> = {
  managing_director:  'MD',
  executive_assistant:'EA',
  hr:                 'HR',
  director:           'Director',
  manager:            'Manager',
  executive:          'Executive',
}

// ─── Cell renderer ────────────────────────────────────────────────────────────

function renderCell(
  col: ColumnDef,
  row: Record<string, unknown>,
  profiles: Profile[],
  departments: Department[],
): React.ReactNode {
  const value = row[col.key]

  switch (col.type as CellType) {
    case 'string':
      return <span className="text-sm text-slate-700">{(value as string) ?? '—'}</span>

    case 'number':
      return <span className="text-sm tabular-nums text-slate-700 text-right block">{value != null ? String(value) : '—'}</span>

    case 'date': {
      if (!value) return <span className="text-sm text-slate-400">—</span>
      const d = new Date(value as string)
      return (
        <span className="text-sm text-slate-700 whitespace-nowrap">
          {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    }

    case 'boolean':
      return (
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', value ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
          {value ? 'Yes' : 'No'}
        </span>
      )

    case 'status_badge': {
      const s = (value as string) ?? ''
      return (
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', TASK_STATUS_COLORS[s] ?? 'bg-slate-100 text-slate-500')}>
          {s || '—'}
        </span>
      )
    }

    case 'jd_status_badge': {
      const s = (value as string) ?? ''
      return (
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', JD_STATUS_COLORS[s] ?? 'bg-slate-100 text-slate-500')}>
          {JD_STATUS_LABELS[s] ?? s}
        </span>
      )
    }

    case 'role_badge': {
      const r = (value as string) ?? ''
      return (
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_COLORS[r] ?? 'bg-slate-100 text-slate-500')}>
          {ROLE_LABELS[r] ?? r}
        </span>
      )
    }

    case 'profile_ref': {
      const p = profiles.find((x) => x.id === value)
      if (!p) return <span className="text-sm text-slate-400">—</span>
      return (
        <div className="flex items-center gap-2">
          <Avatar name={p.full_name} size="xs" />
          <span className="text-sm text-slate-700">{p.full_name}</span>
        </div>
      )
    }

    case 'profile_array': {
      const entries = (value as Array<{ employee_id: string }>) ?? []
      if (!entries.length) return <span className="text-sm text-slate-400">—</span>
      const matched = entries.map((e) => profiles.find((p) => p.id === e.employee_id)).filter(Boolean) as Profile[]
      return (
        <div className="flex items-center gap-1 flex-wrap">
          {matched.map((p) => (
            <div key={p.id} className="flex items-center gap-1">
              <Avatar name={p.full_name} size="xs" />
              <span className="text-xs text-slate-600">{p.full_name}</span>
            </div>
          ))}
        </div>
      )
    }

    case 'dept_ref': {
      const d = departments.find((x) => x.id === value)
      return <span className="text-sm text-slate-700">{d?.name ?? '—'}</span>
    }

    case 'progress_bar': {
      const target    = (value as number) ?? 0
      const compKey   = col.meta?.completed_key ?? ''
      const completed = (row[compKey] as number) ?? 0
      if (!target) return <span className="text-xs text-slate-400">—</span>
      const pct = Math.min(100, Math.round((completed / target) * 100))
      return (
        <div className="space-y-1 min-w-[100px]">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100">
              <div
                className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-slate-500 w-7 shrink-0">{pct}%</span>
          </div>
          <p className="text-[10px] text-slate-400">{completed} / {target}</p>
        </div>
      )
    }

    default:
      return <span className="text-sm text-slate-400">{String(value ?? '—')}</span>
  }
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <ChevronsUpDown size={12} className="text-slate-300 ml-1 inline shrink-0" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="text-blue-500 ml-1 inline shrink-0" />
    : <ChevronDown size={12} className="text-blue-500 ml-1 inline shrink-0" />
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DynamicDataTableProps {
  schema: ColumnDef[]
  data: Record<string, unknown>[]
  profiles?: Profile[]
  departments?: Department[]
  onRowClick?: (row: Record<string, unknown>) => void
  actions?: (row: Record<string, unknown>) => React.ReactNode
  emptyMessage?: string
  loading?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DynamicDataTable({
  schema,
  data,
  profiles = [],
  departments = [],
  onRowClick,
  actions,
  emptyMessage = 'No records found.',
  loading = false,
}: DynamicDataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const visibleCols = schema.filter((c) => c.visible)

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading…</div>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <div className="divide-y divide-slate-100 sm:hidden">
        {sorted.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">{emptyMessage}</p>
        ) : sorted.map((row, i) => (
          <div
            key={(row.id as string) ?? i}
            onClick={() => onRowClick?.(row)}
            className={cn('px-4 py-3', onRowClick && 'cursor-pointer hover:bg-slate-50/70 active:bg-slate-100')}
          >
            {visibleCols.map((col) => (
              <div key={col.key} className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-xs text-slate-400 shrink-0">{col.label}</span>
                <div className="text-right">{renderCell(col, row, profiles, departments)}</div>
              </div>
            ))}
            {actions && <div className="mt-2 flex justify-end">{actions(row)}</div>}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className="py-3 px-5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center hover:text-blue-600 transition-colors"
                    >
                      {col.label}
                      <SortIcon active={sortKey === col.key} dir={sortDir} />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {actions && (
                <th className="py-3 px-5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleCols.length + (actions ? 1 : 0)}
                  className="py-12 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : sorted.map((row, i) => (
              <tr
                key={(row.id as string) ?? i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-slate-50 last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-slate-50/50',
                )}
              >
                {visibleCols.map((col) => (
                  <td key={col.key} className="py-3.5 px-5 max-w-[280px]">
                    {renderCell(col, row, profiles, departments)}
                  </td>
                ))}
                {actions && (
                  <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
