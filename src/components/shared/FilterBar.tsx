import { useState, type ReactNode } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/Dialog'

/**
 * Single-row list toolbar: search box + select filters. On ≥sm the selects
 * sit inline; below sm they collapse into a "Filters" button that opens a
 * dialog. Pages keep owning their filter state and RBAC gating — this only
 * lays the controls out.
 */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  summary,
}: {
  search: string
  onSearchChange: (v: string) => void
  searchPlaceholder?: string
  /** Select elements (already RBAC-gated by the page). */
  filters?: ReactNode
  /** Right-aligned result summary, e.g. "12 of 30 tasks". */
  summary?: string
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const hasFilters = Boolean(filters)

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition"
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {hasFilters && (
        <>
          {/* Inline on ≥sm */}
          <div className="hidden sm:flex items-center gap-2">{filters}</div>
          {/* Dialog trigger below sm */}
          <button
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'sm:hidden inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted',
            )}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
            <DialogContent className="h-auto max-w-[calc(100vw-2rem)] sm:max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl border border-border">
              <DialogHeader>
                <DialogTitle>Filters</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">{filters}</div>
              <DialogFooter>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Apply
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {summary && (
        <p className="hidden md:block text-xs text-muted-foreground whitespace-nowrap shrink-0">{summary}</p>
      )}
    </div>
  )
}
