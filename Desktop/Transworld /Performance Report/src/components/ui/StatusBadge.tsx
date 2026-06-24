import { Badge } from './Badge'
import { statusColor, priorityColor } from '@/lib/utils'
import type { TaskStatus, TaskPriority } from '@/types/database'

export const STATUS_LABELS: Record<string, string> = {
  in_progress: 'In Progress',
  blocked:     'On Hold',
  done:        'Completed',
}

export function StatusBadge({ status }: { status: TaskStatus | string }) {
  const label = STATUS_LABELS[status] ?? status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return <Badge label={label} className={statusColor(status)} dot />
}

export function PriorityBadge({ priority }: { priority: TaskPriority | string }) {
  const label = priority.replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span className={`text-xs font-medium ${priorityColor(priority)}`}>
      {label}
    </span>
  )
}
