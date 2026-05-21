import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Визуальное выделение поля при ошибке валидации (добавлять к className Input/Textarea). */
export function formFieldErrorClass(hasError: boolean) {
  return cn(
    hasError &&
      'border-[var(--destructive)] ring-1 ring-[var(--destructive)]/25 focus-visible:ring-[var(--destructive)]/40'
  )
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function getDaysRemaining(deadline: Date): number {
  const now = new Date()
  const diff = deadline.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function getCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}
