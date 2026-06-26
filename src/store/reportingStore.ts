import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Reporting } from '@/types/database'

type ReportingRow = {
  employee_id: string
  department: string | null
  role: string | null
  branch: string | null
  reporting_to_id: string | null
  employee: { full_name: string }[] | null
  reporting_to: { full_name: string }[] | null
}

interface ReportingStore {
  reportingRecords: Reporting[]
  isLoading: boolean
  fetchReportingRecords: () => Promise<void>
  updateReportingRecord: (employeeId: string, updates: Partial<Reporting>) => Promise<boolean>
  createReportingRecord: (record: Reporting) => Promise<boolean>
  subscribeToRealtime: () => () => void
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

    const formattedRecords: Reporting[] = (data as unknown as ReportingRow[] || []).map((row) => ({
      employee_id: row.employee_id,
      department: row.department ?? '',
      role: (row.role ?? 'Executive') as Reporting['role'],
      branch: row.branch ?? '',
      reporting_to_id: row.reporting_to_id,
      employee_name: row.employee?.[0]?.full_name || 'Unknown',
      reporting_to_name: row.reporting_to?.[0]?.full_name || 'N/A'
    }))

    set({ reportingRecords: formattedRecords, isLoading: false })
  },
  updateReportingRecord: async (employeeId, updates) => {
    const { employee_name: _, reporting_to_name: __, ...dbUpdates } = updates
    const payload = { ...dbUpdates, employee_id: employeeId }

    const { error } = await supabase
      .from('reporting')
      .upsert(payload)

    if (error) {
      console.error('Error updating reporting record:', error)
      return false
    }

    await get().fetchReportingRecords()
    return true
  },

  createReportingRecord: async (record) => {
    const { employee_name: _, reporting_to_name: __, ...dbRecord } = record
    const { error } = await supabase
      .from('reporting')
      .insert(dbRecord)

    if (error) {
      console.error('Error creating reporting record:', error)
      return false
    }

    await get().fetchReportingRecords()
    return true
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel('reporting-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reporting' }, () => get().fetchReportingRecords())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}))
