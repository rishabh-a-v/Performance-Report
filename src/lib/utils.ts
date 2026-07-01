import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

// Today's date as a local-timezone YYYY-MM-DD string. Using
// `new Date().toISOString().slice(0, 10)` computes "today" in UTC, which
// under-reports due-today/overdue during the first hours of each local day
// for timezones ahead of UTC (e.g. IST). This formats in local time instead.
export function todayLocalISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
