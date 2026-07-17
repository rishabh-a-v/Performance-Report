import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  message,
  action,
}: {
  icon?: LucideIcon
  message: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {Icon && <Icon size={28} className="text-muted-foreground opacity-30 mb-3" />}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
