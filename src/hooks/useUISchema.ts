import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ColumnDef } from '@/types/database'

const cache = new Map<string, ColumnDef[]>()

export function useUISchema(tableName: string) {
  const [schema, setSchema] = useState<ColumnDef[]>(cache.get(tableName) ?? [])
  const [loading, setLoading] = useState(!cache.has(tableName))

  useEffect(() => {
    if (cache.has(tableName)) return
    setLoading(true)
    supabase
      .from('ui_schemas')
      .select('columns')
      .eq('table_name', tableName)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const cols = data.columns as ColumnDef[]
          cache.set(tableName, cols)
          setSchema(cols)
        }
        setLoading(false)
      })
  }, [tableName])

  const visibleCols = schema.filter((c) => c.visible)
  return { schema, visibleCols, loading }
}
