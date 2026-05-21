import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  streak: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StreakBadge({ streak, className, size = 'md' }: StreakBadgeProps) {
  if (streak === 0) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-2.5 py-1',
        size === 'lg' && 'text-base px-3 py-1.5',
        streak >= 7
          ? 'bg-orange-100 text-orange-700'
          : 'bg-amber-50 text-amber-600',
        className
      )}
    >
      🔥 {streak}
    </span>
  )
}
