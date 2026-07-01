import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  type OnNodeDrag,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { supabase } from '@/lib/supabase'
import { useProfileStore } from '@/store/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import type { Profile } from '@/types/database'
import { X, Check, Building2, Briefcase, GitBranch, ShieldCheck } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

const ADMIN_ROLES = ['managing_director', 'executive_assistant', 'hr']

// Would setting employeeId's manager to newManagerId create a reporting cycle
// (i.e. is newManagerId currently employeeId themselves, or one of their own
// direct/indirect reports)?
function wouldCreateCycle(profiles: Profile[], employeeId: string, newManagerId: string): boolean {
  if (newManagerId === employeeId) return true
  let current: string | null | undefined = newManagerId
  const seen = new Set<string>()
  while (current) {
    if (current === employeeId) return true
    if (seen.has(current)) return false
    seen.add(current)
    current = profiles.find((p) => p.id === current)?.manager_id
  }
  return false
}

// ── Role colours ─────────────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  managing_director: { bg: '#1e3a5f', border: '#1e3a5f', badge: 'bg-blue-900 text-blue-100', text: 'text-white' },
  director:          { bg: '#1d4ed8', border: '#1d4ed8', badge: 'bg-blue-200 text-blue-900', text: 'text-white' },
  executive_assistant: { bg: '#6d28d9', border: '#6d28d9', badge: 'bg-purple-200 text-purple-900', text: 'text-white' },
  hr:                { bg: '#059669', border: '#059669', badge: 'bg-green-200 text-green-900', text: 'text-white' },
  manager:           { bg: '#0369a1', border: '#0369a1', badge: 'bg-sky-200 text-sky-900', text: 'text-white' },
  executive:         { bg: '#ffffff', border: '#cbd5e1', badge: 'bg-slate-100 text-slate-600', text: 'text-slate-800' },
}

const ROLE_LABEL: Record<string, string> = {
  managing_director: 'MD', director: 'Director', executive_assistant: 'EA',
  hr: 'HR', manager: 'Manager', executive: 'Executive',
}

// ── Employee Node ─────────────────────────────────────────────────────────────
function EmployeeNode({ data }: NodeProps) {
  const p = data.profile as Profile
  const dept = data.deptName as string | undefined
  const colors = ROLE_COLOR[p.role] ?? ROLE_COLOR.executive
  const isDark = p.role !== 'executive'

  return (
    <div
      className="rounded-xl shadow-md border-2 w-44 cursor-grab active:cursor-grabbing select-none"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <Handle type="target" position={Position.Top}    style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      <div className="px-3 pt-3 pb-2.5">
        <div className="flex items-center gap-2">
          <Avatar name={p.full_name} size="sm" className={isDark ? 'ring-2 ring-white/30' : 'ring-2 ring-slate-200'} />
          <div className="min-w-0">
            <p className={`text-xs font-bold leading-tight truncate ${colors.text}`}>{p.full_name}</p>
            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold mt-0.5 ${colors.badge}`}>
              {ROLE_LABEL[p.role] ?? p.role}
            </span>
          </div>
        </div>

        {(dept || p.branch) && (
          <div className={`mt-2 pt-1.5 border-t flex flex-col gap-0.5 ${isDark ? 'border-white/20' : 'border-slate-200'}`}>
            {dept && (
              <div className={`flex items-center gap-1 text-[9px] ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
                <Building2 size={9} />
                <span className="truncate">{dept}</span>
              </div>
            )}
            {p.branch && (
              <div className={`flex items-center gap-1 text-[9px] ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
                <GitBranch size={9} />
                <span>{p.branch}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const nodeTypes = { employee: EmployeeNode }

// ── Layout builder ────────────────────────────────────────────────────────────
const ROLE_ORDER = ['managing_director', 'executive_assistant', 'hr', 'director', 'manager', 'executive']
const X_GAP = 200, Y_GAP = 140

function buildLayout(profiles: Profile[], departments: { id: string; name: string }[]) {
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))

  const byRole: Record<string, Profile[]> = {}
  for (const p of profiles) {
    ;(byRole[p.role] ??= []).push(p)
  }

  const nodes: Node[] = []
  const edges: Edge[] = []
  let y = 60

  for (const role of ROLE_ORDER) {
    const group = byRole[role] ?? []
    if (!group.length) continue
    const startX = -(group.length - 1) * X_GAP / 2

    group.forEach((p, i) => {
      nodes.push({
        id: p.id,
        type: 'employee',
        position: { x: startX + i * X_GAP, y },
        data: { profile: p, deptName: p.department_id ? deptMap[p.department_id] : undefined },
        draggable: true,
      })
      if (p.manager_id && profiles.some((m) => m.id === p.manager_id)) {
        edges.push({
          id: `e-${p.manager_id}-${p.id}`,
          source: p.manager_id,
          target: p.id,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 14, height: 14 },
        })
      }
    })
    y += Y_GAP
  }

  return { nodes, edges }
}

// ── Edit panel ────────────────────────────────────────────────────────────────
interface EditState {
  profile: Profile
  managerId: string
  role: string
  departmentId: string
  branch: string
}

function EditPanel({
  state,
  profiles,
  departments,
  branches,
  onSave,
  onClose,
}: {
  state: EditState
  profiles: Profile[]
  departments: { id: string; name: string }[]
  branches: { id: string; code: string; name: string }[]
  onSave: (s: EditState) => void
  onClose: () => void
}) {
  const [s, setS] = useState(state)
  const managers = profiles.filter(
    (p) =>
      p.id !== s.profile.id &&
      ['managing_director', 'director', 'executive_assistant', 'manager'].includes(p.role) &&
      !wouldCreateCycle(profiles, s.profile.id, p.id)
  )

  return (
    <div className="absolute right-4 top-4 z-50 w-72 rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Briefcase size={14} className="text-indigo-500" />
          <span className="text-sm font-bold text-slate-800">{s.profile.full_name}</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={15} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <Field label="Role">
          <select className={SEL} value={s.role} onChange={(e) => setS({ ...s, role: e.target.value })}>
            {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>

        <Field label="Reports to">
          <select className={SEL} value={s.managerId} onChange={(e) => setS({ ...s, managerId: e.target.value })}>
            <option value="">— None —</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name} ({ROLE_LABEL[m.role] ?? m.role})</option>
            ))}
          </select>
        </Field>

        <Field label="Department">
          <select className={SEL} value={s.departmentId} onChange={(e) => setS({ ...s, departmentId: e.target.value })}>
            <option value="">— None —</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field label="Branch">
          <select className={SEL} value={s.branch} onChange={(e) => setS({ ...s, branch: e.target.value })}>
            <option value="">— None —</option>
            {branches.map((b) => <option key={b.id} value={b.code}>{b.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(s)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  )
}

const SEL = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-300 focus:outline-none'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  )
}

// ── Drop-reassign confirm ─────────────────────────────────────────────────────
interface DropConfirm { employee: Profile; newManager: Profile }

// ── Main page ─────────────────────────────────────────────────────────────────
export function OrgChart() {
  const { role } = useAuth()
  const { profiles, departments, branches, fetchAll } = useProfileStore()
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [editState, setEditState]   = useState<EditState | null>(null)
  const [dropConfirm, setDropConfirm] = useState<DropConfirm | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!profiles.length) return
    const { nodes: n, edges: e } = buildLayout(profiles, departments)
    setNodes(n)
    setEdges(e)
  }, [profiles, departments, setNodes, setEdges])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Click a node → open edit panel
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const p = node.data.profile as Profile
    setEditState({
      profile: p,
      managerId: p.manager_id ?? '',
      role: p.role,
      departmentId: p.department_id ?? '',
      branch: p.branch ?? '',
    })
  }, [])

  // Drag end → detect overlap with another node for manager reassignment
  const onNodeDragStop: OnNodeDrag<Node> = useCallback(
    (_event, draggedNode: Node) => {
      const draggedProfile = draggedNode.data.profile as Profile
      const SNAP = 80

      // Find the closest node we overlapped with
      const overlap = nodes.find((n) => {
        if (n.id === draggedNode.id) return false
        const dx = Math.abs(n.position.x - draggedNode.position.x)
        const dy = Math.abs(n.position.y - draggedNode.position.y)
        return dx < SNAP && dy < SNAP
      })

      if (!overlap) return

      const targetProfile = overlap.data.profile as Profile
      const isValidManager = ['managing_director', 'director', 'executive_assistant', 'manager'].includes(targetProfile.role)
      if (!isValidManager) return
      if (targetProfile.id === draggedProfile.manager_id) return
      if (wouldCreateCycle(profiles, draggedProfile.id, targetProfile.id)) {
        showToast(`Can't reassign — ${targetProfile.full_name} reports (directly or indirectly) to ${draggedProfile.full_name}`)
        return
      }

      setDropConfirm({ employee: draggedProfile, newManager: targetProfile })
    },
    [nodes, profiles],
  )

  // Confirm drag reassignment
  async function confirmDrop() {
    if (!dropConfirm || saving) return
    if (wouldCreateCycle(profiles, dropConfirm.employee.id, dropConfirm.newManager.id)) {
      showToast('Cannot reassign — this would create a reporting cycle')
      setDropConfirm(null)
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: dropConfirm.newManager.id })
      .eq('id', dropConfirm.employee.id)
    setSaving(false)
    setDropConfirm(null)
    if (error) { showToast('Failed to reassign'); return }
    showToast(`${dropConfirm.employee.full_name} now reports to ${dropConfirm.newManager.full_name}`)
    fetchAll()
  }

  // Save edit panel changes
  async function saveEdit(s: EditState) {
    if (s.managerId && wouldCreateCycle(profiles, s.profile.id, s.managerId)) {
      showToast('Cannot save — this would create a reporting cycle')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      role: s.role,
      manager_id: s.managerId || null,
      department_id: s.departmentId || null,
      branch: s.branch || null,
    }).eq('id', s.profile.id)
    setSaving(false)
    if (error) { showToast('Failed to save changes'); return }
    showToast('Changes saved')
    setEditState(null)
    fetchAll()
  }

  const deptList = useMemo(() => departments.map((d) => ({ id: d.id, name: d.name })), [departments])

  if (!ADMIN_ROLES.includes(role ?? '')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <ShieldCheck size={36} className="text-slate-300" />
        <p className="text-slate-500 font-medium">Access restricted</p>
        <p className="text-sm text-slate-400">Only MD, EA, and HR can view the org chart.</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-[calc(100vh-5rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Organisation Chart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Click a card to edit role / department / reporting line. Drag a card onto a manager to reassign.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          {Object.entries(ROLE_COLOR).map(([role, c]) => (
            <div key={role} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full border" style={{ background: c.bg, borderColor: c.border }} />
              {ROLE_LABEL[role]}
            </div>
          ))}
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls showInteractive={false} className="!bottom-4 !left-4" />
          <MiniMap
            nodeColor={(n) => {
              const p = n.data?.profile as Profile | undefined
              return p ? (ROLE_COLOR[p.role]?.bg ?? '#e2e8f0') : '#e2e8f0'
            }}
            maskColor="rgba(248,250,252,0.7)"
            className="!bottom-4 !right-4 !border-slate-200 !rounded-xl"
          />
        </ReactFlow>

        {/* Edit panel */}
        {editState && (
          <EditPanel
            state={editState}
            profiles={profiles}
            departments={deptList}
            branches={branches}
            onSave={saveEdit}
            onClose={() => setEditState(null)}
          />
        )}

        {/* Drop-reassign confirm */}
        {dropConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm font-bold text-slate-800">Reassign reporting line?</p>
              <p className="mt-1.5 text-xs text-slate-500">
                Make <span className="font-semibold text-slate-700">{dropConfirm.employee.full_name}</span> report to{' '}
                <span className="font-semibold text-slate-700">{dropConfirm.newManager.full_name}</span>?
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setDropConfirm(null)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDrop}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
