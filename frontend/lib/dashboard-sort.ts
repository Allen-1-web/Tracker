import type { Goal, Habit } from '@/lib/types'

export type HabitSort = 'default' | 'date-new' | 'date-old'
export type GoalSort = 'deadline-asc' | 'deadline-desc' | 'created-desc'

export function sortTodayHabits(
  habits: Habit[],
  sort: HabitSort,
  isCompleted: (habitId: string) => boolean
): Habit[] {
  const list = [...habits]
  return list.sort((a, b) => {
    if (sort === 'default') {
      const aDone = isCompleted(a.id) ? 1 : 0
      const bDone = isCompleted(b.id) ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      return b.createdAt.getTime() - a.createdAt.getTime()
    }
    const byDate = b.createdAt.getTime() - a.createdAt.getTime()
    return sort === 'date-new' ? byDate : -byDate
  })
}

export function sortActiveGoals(goals: Goal[], sort: GoalSort): Goal[] {
  const active = goals.filter((g) => g.currentValue < g.targetValue)
  return [...active].sort((a, b) => {
    if (sort === 'created-desc') {
      return b.createdAt.getTime() - a.createdAt.getTime()
    }
    const diff = a.deadline.getTime() - b.deadline.getTime()
    return sort === 'deadline-asc' ? diff : -diff
  })
}
