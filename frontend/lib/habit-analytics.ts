import { subDays, format } from 'date-fns'
import type { Habit, HabitLog, HabitStats } from './types'

function isScheduledOnDay(habit: Habit, date: Date): boolean {
  if (habit.isArchived) return false
  const dow = date.getDay()
  if (habit.frequency === 'daily') return true
  if (Array.isArray(habit.frequency)) return habit.frequency.includes(dow)
  return false
}

/** Логи за последние `days` дней с заполнением пропусков (для графиков). */
export function getHabitLogsForRange(
  habitId: string,
  days: number,
  allLogs: HabitLog[]
): HabitLog[] {
  const out: HabitLog[] = []
  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    const log = allLogs.find((l) => l.habitId === habitId && l.date === date)
    out.push(log ?? { habitId, date, completed: false })
  }
  return out.reverse()
}

export function buildWeeklyActivity(
  habits: Habit[],
  habitLogs: HabitLog[]
): { day: string; completed: number; total: number }[] {
  const result: { day: string; completed: number; total: number }[] = []
  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayHabits = habits.filter((h) => {
      if (h.isArchived) return false
      const dow = date.getDay()
      if (h.frequency === 'daily') return true
      if (Array.isArray(h.frequency)) return h.frequency.includes(dow)
      return false
    })
    const completed = dayHabits.filter((h) =>
      habitLogs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed)
    ).length
    result.push({ day: dayNames[date.getDay()], completed, total: dayHabits.length })
  }
  return result
}

export function computeHabitStats(habit: Habit, allLogs: HabitLog[]): HabitStats {
  const today = new Date()
  const logsByDate = new Map(
    allLogs.filter((l) => l.habitId === habit.id).map((l) => [l.date, l.completed])
  )

  function scheduledInRange(dayCount: number): string[] {
    const dates: string[] = []
    for (let i = 0; i < dayCount; i++) {
      const d = subDays(today, i)
      if (isScheduledOnDay({ ...habit, isArchived: false }, d)) dates.push(format(d, 'yyyy-MM-dd'))
    }
    return dates
  }

  const dates30 = scheduledInRange(30)
  const completed30 = dates30.filter((d) => logsByDate.get(d) === true).length
  const completionRate30 =
    dates30.length === 0 ? 0 : Math.round((completed30 / dates30.length) * 100)

  const dates90 = scheduledInRange(90)
  const completed90 = dates90.filter((d) => logsByDate.get(d) === true).length
  const completionRate90 =
    dates90.length === 0 ? 0 : Math.round((completed90 / dates90.length) * 100)

  let currentStreak = 0
  for (let i = 0; i < 370; i++) {
    const d = subDays(today, i)
    if (!isScheduledOnDay({ ...habit, isArchived: false }, d)) continue
    const ds = format(d, 'yyyy-MM-dd')
    if (logsByDate.get(ds) === true) currentStreak++
    else break
  }

  let bestStreak = 0
  let run = 0
  for (let i = 370; i >= 0; i--) {
    const d = subDays(today, i)
    if (!isScheduledOnDay({ ...habit, isArchived: false }, d)) {
      run = 0
      continue
    }
    const ds = format(d, 'yyyy-MM-dd')
    if (logsByDate.get(ds) === true) {
      run++
      bestStreak = Math.max(bestStreak, run)
    } else run = 0
  }

  const totalCompleted = allLogs.filter((l) => l.habitId === habit.id && l.completed).length

  return {
    habitId: habit.id,
    currentStreak,
    bestStreak,
    completionRate30,
    completionRate90,
    totalCompleted,
  }
}

export function computeAllHabitStats(habits: Habit[], allLogs: HabitLog[]): HabitStats[] {
  return habits.map((h) => computeHabitStats(h, allLogs))
}
