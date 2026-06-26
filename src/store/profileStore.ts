import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Profile, Department, Branch } from '@/types/database'

interface ProfileStore {
  profiles: Profile[]
  departments: Department[]
  branches: Branch[]
  isLoading: boolean
  fetchProfiles: () => Promise<void>
  fetchDepartments: () => Promise<void>
  fetchBranches: () => Promise<void>
  fetchAll: () => Promise<void>
  getProfileById: (id: string) => Profile | undefined
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  departments: [],
  branches: [],
  isLoading: false,

  fetchProfiles: async () => {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) { console.error('Error fetching profiles:', error); return }
    set({ profiles: data as Profile[] })
  },

  fetchDepartments: async () => {
    const { data, error } = await supabase.from('departments').select('*')
    if (error) { console.error('Error fetching departments:', error); return }
    set({ departments: data as Department[] })
  },

  fetchBranches: async () => {
    const { data, error } = await supabase.from('branches').select('*').order('name')
    if (error) { console.error('Error fetching branches:', error); return }
    set({ branches: data as Branch[] })
  },

  fetchAll: async () => {
    set({ isLoading: true })
    await Promise.all([get().fetchProfiles(), get().fetchDepartments(), get().fetchBranches()])
    set({ isLoading: false })
  },

  getProfileById: (id) => get().profiles.find((p) => p.id === id),
}))
