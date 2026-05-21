import Link from 'next/link'
import { EmptyState } from '@/components/shared/empty-state'
import { StreakBadge } from '@/components/shared/streak-badge'
import type { Habit, HabitStats } from '@/lib/types'

interface LinkedHabitsListProps {
  habits: Habit[]
  stats: HabitStats[]
}

export function LinkedHabitsList({ habits, stats }: LinkedHabitsListProps) {
  if (habits.length === 0) {
    return (
      <EmptyState
        icon="🔗"
        title="Нет связанных привычек"
        description="Свяжите привычку с целью в настройках привычки или выберите существующую."
        compact
        action={{ label: 'К привычкам', href: '/habits' }}
      />
    )
  }

  return (
    <div className="space-y-2">
      {habits.map((habit) => {
        const habitStats = stats.find((s) => s.habitId === habit.id)
        return (
          <Link
            key={habit.id}
            href={`/habits/${habit.id}`}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--accent)] transition-colors"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: habit.color + '20' }}
            >
              <span className="text-lg">{habit.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{habit.name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{habit.category}</p>
            </div>
            {habitStats && <StreakBadge streak={habitStats.currentStreak} size="sm" />}
          </Link>
        )
      })}
    </div>
  )
}
