import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CapacityPlan } from '@/types/database'

interface CapacityStore {
  plans: CapacityPlan[]
  isLoading: boolean
  fetchPlans: () => Promise<void>
  upsertPlan: (branch: string, departmentId: string, role: string, plannedHeadcount: number, planMonth: string) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  subscribeToRealtime: () => () => void
}

export const useCapacityStore = create<CapacityStore>((set, get) => ({
  plans: [],
  isLoading: false,

  fetchPlans: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase.from('capacity_plans').select('*')
    if (error) { console.error('Error fetching capacity plans:', error); set({ isLoading: false }); return }
    set({ plans: data as CapacityPlan[], isLoading: false })
  },

  upsertPlan: async (branch, departmentId, role, plannedHeadcount, planMonth) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('capacity_plans')
      .upsert(
        { branch, department_id: departmentId, role, planned_headcount: plannedHeadcount, plan_month: planMonth, created_by: user?.id ?? null, updated_at: new Date().toISOString() },
        { onConflict: 'branch,department_id,role,plan_month' }
      )
    if (error) { console.error('Error upserting capacity plan:', error); return }
    await get().fetchPlans()
  },

  deletePlan: async (id) => {
    const { error } = await supabase.from('capacity_plans').delete().eq('id', id)
    if (error) { console.error('Error deleting capacity plan:', error); return }
    set((s) => ({ plans: s.plans.filter((p) => p.id !== id) }))
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('capacity-plans-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capacity_plans' }, () => get().fetchPlans())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}))
