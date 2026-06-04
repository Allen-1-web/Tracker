import type { Habit } from '../../domain/habit.js'

export function isScheduledOnDay(habit: Habit, date: Date): boolean {
  if (habit.isArchived) return false
  const dow = date.getDay()
  if (habit.frequency === 'daily') return true
  if (Array.isArray(habit.frequency)) return habit.frequency.includes(dow)
  return false
}

export function habitsForDay(habits: Habit[], dayOfWeek: number): Habit[] {
  return habits.filter((h) => {
    if (h.isArchived) return false
    if (h.frequency === 'daily') return true
    if (Array.isArray(h.frequency)) return h.frequency.includes(dayOfWeek)
    return false
  })
}
