'use client'

import { useStore } from '@/lib/store'
import { buildWeeklyActivity } from '@/lib/habit-analytics'

export function WeeklyActivityStrip() {
  const habits = useStore((s) => s.habits)
  const habitLogs = useStore((s) => s.habitLogs)
  const days = buildWeeklyActivity(habits, habitLogs)

  return (
    <div className="flex gap-1.5 items-end">
      {days.map((d, i) => {
        const pct = d.total === 0 ? 0 : d.completed / d.total
        const isToday = i === days.length - 1
        const height = Math.max(pct * 100, 8)

        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className="relative w-full" style={{ height: 48 }}>
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-md motion-safe:transition-[height,background-color] motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none ${
                  isToday ? 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--background)]' : ''
                }`}
                style={{
                  height: `${height}%`,
                  backgroundColor:
                    pct >= 0.8
                      ? '#22c55e'
                      : pct >= 0.5
                        ? '#6366f1'
                        : pct > 0
                          ? '#e2e8f0'
                          : '#f1f5f9',
                }}
              />
            </div>
            <span
              className={`text-xs ${isToday ? 'font-bold text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`}
            >
              {d.day}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {d.completed}/{d.total}
            </span>
          </div>
        )
      })}
    </div>
  )
}
