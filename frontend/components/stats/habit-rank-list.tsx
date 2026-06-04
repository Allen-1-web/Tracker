'use client'

import Link from 'next/link'
import type { Habit, HabitRankEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

function HorizBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full motion-safe:transition-all motion-safe:duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

interface HabitRankListProps {
  habits: Habit[]
  entries: HabitRankEntry[]
  title: string
  accentColor?: string
  showRank?: boolean
}

export function HabitRankList({
  habits,
  entries,
  title,
  accentColor = '#22c55e',
  showRank = false,
}: HabitRankListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">Нет данных за выбранный период</p>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      {entries.map((entry, i) => {
        const habit = habits.find((h) => h.id === entry.habitId)
        if (!habit) return null
        return (
          <Link
            key={entry.habitId}
            href={`/habits/${entry.habitId}`}
            className="flex items-center gap-3 rounded-lg p-1 -mx-1 hover:bg-[var(--accent)] transition-colors"
          >
            {showRank && (
              <span className="text-[var(--muted-foreground)] text-sm w-4 shrink-0">#{i + 1}</span>
            )}
            <span className="text-base shrink-0">{habit.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{habit.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <HorizBar pct={entry.rate} color={accentColor} />
                <span
                  className={cn('text-xs font-semibold shrink-0 tabular-nums')}
                  style={{ color: accentColor }}
                >
                  {entry.rate}%
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
