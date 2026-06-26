import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { RolePermission } from '@/types/database'

interface PermissionStore {
  permissions: RolePermission | null
  allPermissions: RolePermission[]
  isLoading: boolean
  fetchPermissions: (role: string) => Promise<void>
  fetchAllPermissions: () => Promise<void>
  updatePermission: (role: string, updates: Partial<RolePermission>, updatedBy: string) => Promise<void>
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  permissions: null,
  allPermissions: [],
  isLoading: false,

  fetchPermissions: async (role: string) => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', role)
      .single()
    if (error) {
      console.error('Error fetching role permissions:', error)
      set({ isLoading: false })
      return
    }
    set({ permissions: data as RolePermission, isLoading: false })
  },

  fetchAllPermissions: async () => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role')
    if (error) {
      console.error('Error fetching all permissions:', error)
      return
    }
    set({ allPermissions: data as RolePermission[] })
  },

  updatePermission: async (role, updates, updatedBy) => {
    const { error } = await supabase
      .from('role_permissions')
      .update({ ...updates, updated_by: updatedBy })
      .eq('role', role)
    if (error) {
      console.error('Error updating permission:', error)
      return
    }
    set((s) => ({
      allPermissions: s.allPermissions.map((p) =>
        p.role === role ? { ...p, ...updates } : p
      ),
      permissions: s.permissions?.role === role
        ? { ...s.permissions, ...updates }
        : s.permissions,
    }))
  },
}))
