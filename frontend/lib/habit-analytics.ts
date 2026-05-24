import { subDays, format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns'
import type {
  DayCompletion,
  GlobalHabitStats,
  Habit,
  HabitLog,
  HabitRankEntry,
  HabitRecap,
  HabitStats,
} from './types'

function isScheduledOnDay(habit: Habit, date: Date): boolean {
  if (habit.isArchived) return false
  const dow = date.getDay()
  if (habit.frequency === 'daily') return true
  if (Array.isArray(habit.frequency)) return habit.frequency.includes(dow)
  return false
}

function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.isArchived)
}

/** Запланированные привычки и выполнение за конкретный день. */
export function dayCompletion(habits: Habit[], logs: HabitLog[], date: Date): DayCompletion {
  const dateStr = format(date, 'yyyy-MM-dd')
  const scheduled = habits.filter((h) => isScheduledOnDay(h, date))
  const completed = scheduled.filter((h) =>
    logs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed)
  ).length
  const total = scheduled.length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { date: dateStr, completed, total, pct }
}

/** Подряд идущие «идеальные» дни: все запланированные привычки выполнены. */
export function computePerfectDayStreak(habits: Habit[], logs: HabitLog[]): number {
  const active = activeHabits(habits)
  let streak = 0
  for (let i = 0; i < 370; i++) {
    const d = subDays(new Date(), i)
    const { total, completed } = dayCompletion(active, logs, d)
    if (total === 0) continue
    if (completed === total) streak++
    else break
  }
  return streak
}

/** Суммарный % выполнения всех слотов за N дней. */
export function computeAggregateCompletionRate(
  habits: Habit[],
  logs: HabitLog[],
  days: number
): number {
  const active = activeHabits(habits)
  let totalSlots = 0
  let completedSlots = 0
  for (let i = 0; i < days; i++) {
    const { total, completed } = dayCompletion(active, logs, subDays(new Date(), i))
    totalSlots += total
    completedSlots += completed
  }
  return totalSlots === 0 ? 0 : Math.round((completedSlots / totalSlots) * 100)
}

export function computeGlobalStats(habits: Habit[], logs: HabitLog[]): GlobalHabitStats {
  const active = activeHabits(habits)
  const perHabit = computeAllHabitStats(active, logs)
  return {
    activeHabits: active.length,
    perfectDayStreak: computePerfectDayStreak(habits, logs),
    bestHabitStreak:
      perHabit.length > 0 ? Math.max(...perHabit.map((s) => s.currentStreak), 0) : 0,
    completionRate7: computeAggregateCompletionRate(habits, logs, 7),
    completionRate30: computeAggregateCompletionRate(habits, logs, 30),
    completionRate90: computeAggregateCompletionRate(habits, logs, 90),
  }
}

export function buildGlobalHeatmapDays(
  habits: Habit[],
  logs: HabitLog[],
  days = 365
): DayCompletion[] {
  const active = activeHabits(habits)
  const out: DayCompletion[] = []
  for (let i = days - 1; i >= 0; i--) {
    out.push(dayCompletion(active, logs, subDays(new Date(), i)))
  }
  return out
}

export function buildWeeklyCompletionRates(
  habits: Habit[],
  logs: HabitLog[],
  weeks = 12
): { week: string; pct: number }[] {
  const active = activeHabits(habits)
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = startOfWeek(subWeeks(new Date(), weeks - 1 - i), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const intervalEnd = weekEnd <= new Date() ? weekEnd : new Date()
    const days = eachDayOfInterval({ start: weekStart, end: intervalEnd })
    let total = 0
    let completed = 0
    for (const d of days) {
      const dc = dayCompletion(active, logs, d)
      total += dc.total
      completed += dc.completed
    }
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { week: format(weekStart, 'd MMM'), pct }
  })
}

export function rankHabitsByRate(habits: Habit[], logs: HabitLog[], days: number): HabitRankEntry[] {
  return activeHabits(habits)
    .map((h) => {
      const stats = computeHabitStats(h, logs)
      const rate =
        days <= 7
          ? computeHabitRateForDays(h, logs, days)
          : days <= 30
            ? stats.completionRate30
            : stats.completionRate90
      return { habitId: h.id, rate }
    })
    .sort((a, b) => b.rate - a.rate)
}

function computeHabitRateForDays(habit: Habit, logs: HabitLog[], days: number): number {
  const today = new Date()
  const logsByDate = new Map(
    logs.filter((l) => l.habitId === habit.id).map((l) => [l.date, l.completed])
  )
  let scheduled = 0
  let completed = 0
  for (let i = 0; i < days; i++) {
    const d = subDays(today, i)
    if (!isScheduledOnDay({ ...habit, isArchived: false }, d)) continue
    scheduled++
    if (logsByDate.get(format(d, 'yyyy-MM-dd')) === true) completed++
  }
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100)
}

function recapForPeriod(
  habits: Habit[],
  logs: HabitLog[],
  period: 'week' | 'month'
): HabitRecap {
  const days = period === 'week' ? 7 : 30
  const active = activeHabits(habits)
  const currentRate = computeAggregateCompletionRate(habits, logs, days)
  const previousRate = computeAggregateCompletionRateForRange(habits, logs, days, days)
  let perfectDays = 0
  let activeDays = 0
  for (let i = 0; i < days; i++) {
    const dc = dayCompletion(active, logs, subDays(new Date(), i))
    if (dc.total === 0) continue
    activeDays++
    if (dc.completed === dc.total) perfectDays++
  }
  const ranked = rankHabitsByRate(habits, logs, days)
  return {
    period,
    completionRate: currentRate,
    previousCompletionRate: previousRate,
    delta: currentRate - previousRate,
    perfectDays,
    activeDays,
    topHabits: ranked.slice(0, 3),
    weakHabits: [...ranked].reverse().slice(0, 3),
  }
}

function computeAggregateCompletionRateForRange(
  habits: Habit[],
  logs: HabitLog[],
  length: number,
  offset: number
): number {
  const active = activeHabits(habits)
  let totalSlots = 0
  let completedSlots = 0
  for (let i = offset; i < offset + length; i++) {
    const { total, completed } = dayCompletion(active, logs, subDays(new Date(), i))
    totalSlots += total
    completedSlots += completed
  }
  return totalSlots === 0 ? 0 : Math.round((completedSlots / totalSlots) * 100)
}

export function buildWeeklyRecap(habits: Habit[], logs: HabitLog[]): HabitRecap {
  return recapForPeriod(habits, logs, 'week')
}

export function buildMonthlyRecap(habits: Habit[], logs: HabitLog[]): HabitRecap {
  return recapForPeriod(habits, logs, 'month')
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
