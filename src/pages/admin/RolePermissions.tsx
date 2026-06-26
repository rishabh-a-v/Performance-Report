import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermissionStore } from '@/store/permissionStore'
import { ShieldCheck, RefreshCw, Info } from 'lucide-react'
import type { RolePermission } from '@/types/database'
import { cn } from '@/lib/utils'

const ADMIN_ROLES = ['managing_director', 'executive_assistant', 'hr']

const COLUMNS: Array<{
  key: keyof RolePermission
  label: string
  hint: string
}> = [
  {
    key: 'can_view_all_branches',
    label: 'View All Branches',
    hint: 'When OFF, the user only sees employees/tasks in their own branch.',
  },
  {
    key: 'can_view_all_departments',
    label: 'View All Departments',
    hint: 'When OFF, the user is restricted to their own department within their branch.',
  },
  {
    key: 'can_filter_branch',
    label: 'Branch Filter',
    hint: 'Shows a "Select Branch" dropdown above tables so the user can narrow results by branch.',
  },
  {
    key: 'can_filter_department',
    label: 'Dept Filter',
    hint: 'Shows a "Select Department" dropdown above tables.',
  },
  {
    key: 'must_be_in_reporting_chain',
    label: 'Reporting Chain Only',
    hint: 'When ON, the user can only see employees who report to them (directly or indirectly).',
  },
  {
    key: 'can_create_job_directions',
    label: 'Create Job Directions',
    hint: 'When ON, the user can create and assign Job Directions to employees.',
  },
  {
    key: 'can_create_tasks',
    label: 'Create Tasks',
    hint: 'When ON, the user can create Special Tasks and assign them to employees.',
  },
  {
    key: 'can_approve_job_directions',
    label: 'Approve Job Directions',
    hint: 'When ON, the user can approve or reject Job Directions submitted for review.',
  },
  {
    key: 'can_approve_tasks',
    label: 'Acknowledge Tasks',
    hint: 'When ON, the user can acknowledge or request revision on completed tasks.',
  },
]

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1',
        value ? 'bg-indigo-600' : 'bg-slate-200',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
          value ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function RolePermissions() {
  const { user, role } = useAuth()
  const { allPermissions, fetchAllPermissions, updatePermission } = usePermissionStore()
  const [saving, setSaving] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<string | null>(null)

  useEffect(() => {
    fetchAllPermissions()
  }, [])

  if (!ADMIN_ROLES.includes(role ?? '')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <ShieldCheck size={36} className="text-slate-300" />
        <p className="text-slate-500 font-medium">Access restricted</p>
        <p className="text-sm text-slate-400">Only MD, EA, and HR can view this page.</p>
      </div>
    )
  }

  async function handleToggle(perm: RolePermission, key: keyof RolePermission) {
    if (saving || !user) return
    setSaving(`${perm.role}-${String(key)}`)
    await updatePermission(
      perm.role,
      { [key]: !perm[key] } as Partial<RolePermission>,
      user.id
    )
    setSaving(null)
  }

  const ROLE_DISPLAY_ORDER = [
    'managing_director',
    'executive_assistant',
    'hr',
    'director',
    'manager',
    'executive',
  ]

  const sorted = [...allPermissions].sort(
    (a, b) => ROLE_DISPLAY_ORDER.indexOf(a.role) - ROLE_DISPLAY_ORDER.indexOf(b.role)
  )

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={22} className="text-indigo-600" />
            Role Permissions
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Toggle access rules for each role. Changes take effect immediately for all users with that role.
          </p>
        </div>
        <button
          onClick={fetchAllPermissions}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <Info size={15} className="shrink-0 mt-0.5 text-amber-600" />
        <span>
          Changes here update the database instantly. The frontend reads these settings on every login —
          existing sessions see the new rules on their next page load.
        </span>
      </div>

      {/* Permissions table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3.5 text-left">Role</th>
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {col.label}
                    <button
                      onMouseEnter={() => setTooltip(col.key)}
                      onMouseLeave={() => setTooltip(null)}
                      className="relative text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <Info size={12} />
                      {tooltip === col.key && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-white shadow-lg text-left z-20">
                          {col.hint}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                        </div>
                      )}
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-5 py-3.5 text-left text-slate-400">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 2} className="px-5 py-10 text-center text-slate-400">
                  Loading permissions…
                </td>
              </tr>
            ) : (
              sorted.map((perm) => {
                const isAdminRole = ADMIN_ROLES.includes(perm.role)
                return (
                  <tr key={perm.role} className={cn('transition-colors hover:bg-slate-50/60', isAdminRole && 'bg-indigo-50/30')}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{perm.label}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{perm.role}</p>
                      </div>
                    </td>
                    {COLUMNS.map((col) => {
                      const boolVal = perm[col.key] as boolean
                      const isSaving = saving === `${perm.role}-${String(col.key)}`
                      return (
                        <td key={col.key} className="px-4 py-4 text-center">
                          <div className="flex justify-center">
                            <Toggle
                              value={boolVal}
                              onChange={() => handleToggle(perm, col.key)}
                              disabled={!!saving || isSaving}
                            />
                          </div>
                          {isSaving && (
                            <p className="text-[10px] text-indigo-500 mt-1 animate-pulse">Saving…</p>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {perm.updated_at
                        ? new Date(perm.updated_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        <strong className="text-slate-500">Note:</strong> The Executive row is read-only in practice — executives
        only see their own data via the "My" tabs and never access team views.
      </p>
    </div>
  )
}
