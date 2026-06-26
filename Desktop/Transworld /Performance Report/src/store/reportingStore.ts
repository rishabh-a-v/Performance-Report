import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Reporting } from '@/types/database'

interface ReportingStore {
  reportingRecords: Reporting[]
  isLoading: boolean
  fetchReportingRecords: () => Promise<void>
  updateReportingRecord: (employeeId: string, updates: Partial<Reporting>) => Promise<boolean>
  createReportingRecord: (record: Reporting) => Promise<boolean>
}

export const useReportingStore = create<ReportingStore>((set, get) => ({
  reportingRecords: [],
  isLoading: false,

  fetchReportingRecords: async () => {
    set({ isLoading: true })
    const { data, error } = await supabase
      .from('reporting')
      .select(`
        employee_id,
        department,
        role,
        branch,
        reporting_to_id,
        employee:profiles!reporting_employee_id_fkey(full_name),
        reporting_to:profiles!reporting_reporting_to_id_fkey(full_name)
      `)

    if (error) {
      console.error('Error fetching reporting records:', error)
      set({ isLoading: false })
      return
    }

    const formattedRecords: Reporting[] = (data || []).map((row: any) => ({
      employee_id: row.employee_id,
      department: row.department,
      role: row.role,
      branch: row.branch,
      reporting_to_id: row.reporting_to_id,
      employee_name: row.employee?.full_name || 'Unknown',
      reporting_to_name: row.reporting_to?.full_name || 'N/A'
    }))

    set({ reportingRecords: formattedRecords, isLoading: false })
  },
  updateReportingRecord: async (employeeId, updates) => {
    const { employee_name, reporting_to_name, ...dbUpdates } = updates as any
    dbUpdates.employee_id = employeeId

    const { error } = await supabase
      .from('reporting')
      .upsert(dbUpdates)

    if (error) {
      console.error('Error updating reporting record:', error)
      return false
    }

    await get().fetchReportingRecords()
    return true
  },

  createReportingRecord: async (record) => {
    const { employee_name, reporting_to_name, ...dbRecord } = record as any
    const { error } = await supabase
      .from('reporting')
      .insert(dbRecord)

    if (error) {
      console.error('Error creating reporting record:', error)
      return false
    }

    await get().fetchReportingRecords()
    return true
  }
}))
