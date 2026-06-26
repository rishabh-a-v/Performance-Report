import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { JobDirection } from '@/types/database'

interface JobDirectionStore {
  directions: JobDirection[]
  isLoading: boolean

  fetchDirections: () => Promise<void>
  fetchMilestones: () => Promise<void>
  fetchAll: () => Promise<void>
  subscribeToRealtime: () => () => void

  addDirection: (jd: Omit<JobDirection, 'id' | 'daily_completed' | 'weekly_completed' | 'monthly_completed'>) => Promise<void>
  deleteDirection: (id: string) => Promise<void>
  requestDeletion: (id: string) => Promise<void>
  approveDeletion: (id: string) => Promise<void>
  rejectDeletion: (id: string) => Promise<void>
  addDirectionWithMilestones: (
    jd: Omit<JobDirection, 'id' | 'daily_completed' | 'weekly_completed' | 'monthly_completed'>,
    milestoneTitles: string[]
  ) => Promise<void>
  updateProgress: (id: string, loggedValue: number) => Promise<void>
  submitForReview: (id: string) => Promise<void>
  approveDirection: (id: string, managerId: string, notes: string) => Promise<void>
  rejectDirection: (id: string, notes: string) => Promise<void>
  requestChanges: (id: string, notes: string) => Promise<void>
  toggleMilestone: (milestoneId: string) => Promise<void>
  updateDirection: (id: string, updates: Partial<JobDirection>) => Promise<void>
  getDirectionsForEmployee: (employeeId: string) => JobDirection[]
  getPendingForManager: (managerId: string) => JobDirection[]
  getMilestonesForDirection: (jdId: string) => any[]
  getPendingVerificationFor: (verifierId: string) => JobDirection[]
  approveTopDownJD: (id: string, verifierId: string, notes?: string) => Promise<void>
  rejectTopDownJD: (id: string, verifierId: string, notes?: string) => Promise<void>
}

export const useJobDirectionStore = create<JobDirectionStore>((set, get) => ({
  directions: [],
  isLoading: false,

  fetchDirections: async () => {
    const { data, error } = await supabase.from('job_directions_with_progress').select('*')
    if (error) {
      console.error('Error fetching job directions:', error)
      return
    }
    set({ directions: data as JobDirection[] })
  },

  fetchMilestones: async () => {
    // Milestones are deprecated/dropped in the strict blueprint
  },

  fetchAll: async () => {
    set({ isLoading: true })
    await get().fetchDirections()
    set({ isLoading: false })
  },

  addDirection: async (jd) => {
    const { data, error } = await supabase
      .from('job_directions')
      .insert(jd)
      .select()
      .single()

    if (error) {
      console.error('Error adding job direction:', error)
      return
    }

    set((s) => ({
      directions: [
        {
          ...data,
          daily_completed: 0,
          weekly_completed: 0,
          monthly_completed: 0,
        } as JobDirection,
        ...s.directions,
      ],
    }))
  },

  addDirectionWithMilestones: async (jd, _milestones) => {
    await get().addDirection(jd)
  },

  updateProgress: async (id, loggedValue) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('job_direction_progress_logs')
      .insert({
        job_direction_id: id,
        amount_completed: loggedValue,
        employee_id: user.id
      })

    if (error) {
      console.error('Error updating progress logs:', error)
      return
    }

    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id
          ? {
              ...d,
              daily_completed: (d.daily_completed ?? 0) + loggedValue,
              weekly_completed: (d.weekly_completed ?? 0) + loggedValue,
              monthly_completed: (d.monthly_completed ?? 0) + loggedValue,
            }
          : d
      ),
    }))
  },

  submitForReview: async (id) => {
    const { error } = await supabase
      .from('job_directions')
      .update({ status: 'submitted' })
      .eq('id', id)

    if (error) {
      console.error('Error submitting for review:', error)
      return
    }

    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, status: 'submitted' } : d
      ),
    }))
  },

  approveDirection: async (id, _managerId, notes) => {
    await get().updateDirection(id, { status: 'active', remarks: notes })
  },

  rejectDirection: async (id, notes) => {
    await get().updateDirection(id, { status: 'rejected', remarks: notes })
  },

  requestChanges: async (id, notes) => {
    await get().updateDirection(id, { status: 'rejected', remarks: notes })
  },

  toggleMilestone: async (_milestoneId) => {
    // Milestones are deprecated
  },

  deleteDirection: async (id) => {
    const { error } = await supabase.from('job_directions').delete().eq('id', id)
    if (error) { console.error('Error deleting direction:', error); return }
    set((s) => ({ directions: s.directions.filter((d) => d.id !== id) }))
  },

  requestDeletion: async (id) => {
    const { error } = await supabase
      .from('job_directions')
      .update({ status: 'deletion_requested' })
      .eq('id', id)
    if (error) { console.error('Error requesting deletion:', error); return }
    set((s) => ({
      directions: s.directions.map((d) => d.id === id ? { ...d, status: 'deletion_requested' } : d),
    }))
  },

  approveDeletion: async (id) => {
    const { error } = await supabase.from('job_directions').delete().eq('id', id)
    if (error) { console.error('Error approving deletion:', error); return }
    set((s) => ({ directions: s.directions.filter((d) => d.id !== id) }))
  },

  rejectDeletion: async (id) => {
    const { error } = await supabase
      .from('job_directions')
      .update({ status: 'active' })
      .eq('id', id)
    if (error) { console.error('Error rejecting deletion:', error); return }
    set((s) => ({
      directions: s.directions.map((d) => d.id === id ? { ...d, status: 'active' } : d),
    }))
  },

  updateDirection: async (id, updates) => {
    const { error } = await supabase
      .from('job_directions')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Error updating direction:', error)
      return
    }

    set((s) => ({
      directions: s.directions.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    }))
  },

  getDirectionsForEmployee: (employeeId) => {
    return get().directions.filter((d) => d.employee_id === employeeId)
  },

  getPendingForManager: (managerId) => {
    return get().directions.filter(
      (d) => d.manager_id === managerId && d.status === 'submitted'
    )
  },

  getMilestonesForDirection: (_jdId) => {
    return []
  },

  getPendingVerificationFor: (_verifierId) => {
    return []
  },

  approveTopDownJD: async (id, _verifierId, notes) => {
    await get().updateDirection(id, { status: 'active', remarks: notes ?? null })
  },

  rejectTopDownJD: async (id, _verifierId, notes) => {
    await get().updateDirection(id, { status: 'rejected', remarks: notes ?? null })
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('job-directions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_directions' }, () => get().fetchDirections())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_direction_progress_logs' }, () => get().fetchDirections())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}))
