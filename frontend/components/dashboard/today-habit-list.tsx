'use client'

import { useStore } from '@/lib/store'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/shared/empty-state'
import { sortTodayHabits, type HabitSort } from '@/lib/dashboard-sort'
import { format } from 'date-fns'
import type { Habit } from '@/lib/types'

interface HabitCheckItemProps {
  habit: Habit
  completed: boolean
  onToggle: () => void
}

function HabitCheckItem({ habit, completed, onToggle }: HabitCheckItemProps) {
  return (
    <div
      className={`flex items-center gap-3 py-2.5 -mx-1 px-1 rounded-lg transition-colors cursor-pointer ${
        completed ? 'bg-[var(--primary)]/6' : 'hover:bg-[var(--muted)]/35'
      }`}
      onClick={onToggle}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
        style={{ backgroundColor: habit.color + '20' }}
      >
        {habit.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            completed ? 'line-through text-[var(--muted-foreground)]' : ''
          }`}
        >
          {habit.name}
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">{habit.category}</p>
      </div>
      <Checkbox
        checked={completed}
        onCheckedChange={onToggle}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

interface TodayHabitListProps {
  sort?: HabitSort
}

export function TodayHabitList({ sort = 'default' }: TodayHabitListProps) {
  const { habits, habitLogs, toggleHabitLog } = useStore()
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayDow = new Date().getDay()

  const todayHabits = habits.filter((h) => {
    if (h.isArchived) return false
    if (h.frequency === 'daily') return true
    if (Array.isArray(h.frequency)) return h.frequency.includes(todayDow)
    return false
  })

  const isCompleted = (habitId: string) =>
    habitLogs.some((l) => l.habitId === habitId && l.date === today && l.completed)

  const sortedHabits = sortTodayHabits(todayHabits, sort, isCompleted)

  if (sortedHabits.length === 0) {
    const hasAnyHabits = habits.some((h) => !h.isArchived)
    return (
      <EmptyState
        icon={hasAnyHabits ? '📅' : '✨'}
        title={hasAnyHabits ? 'Сегодня без привычек' : 'Нет активных привычек'}
        description={
          hasAnyHabits
            ? 'На сегодня по расписанию нет ни одной привычки — отличный день для отдыха или добавьте ещё одну.'
            : 'Создайте привычку, чтобы она появилась в списке на сегодня.'
        }
        compact
        action={
          hasAnyHabits
            ? { label: 'К привычкам', href: '/habits' }
            : { label: 'Добавить привычку', href: '/habits' }
        }
      />
    )
  }

  return (
    <div className="divide-y divide-[var(--border)]/70">
      {sortedHabits.map((habit) => (
        <HabitCheckItem
          key={habit.id}
          habit={habit}
          completed={isCompleted(habit.id)}
          onToggle={() => void toggleHabitLog(habit.id)}
        />
      ))}
    </div>
  )
}
