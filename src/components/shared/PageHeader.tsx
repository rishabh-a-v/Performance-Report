import type { ReactNode } from 'react'
import { useIsNativeApp } from '@/hooks/useIsNativeApp'

/**
 * Standard page header: one row of title (+ optional description) with a
 * right-aligned actions slot, and an optional `children` block below for
 * tab strips so tabs belong to the header rather than a second card.
 *
 * On the native app the MobileHeader already shows the page title, so the
 * title row collapses to just the actions to avoid duplication.
 */
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
}) {
  const isNative = useIsNativeApp()

  return (
    <div className="space-y-4">
      {(!isNative || actions) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {!isNative ? (
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          ) : (
            <div />
          )}
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
