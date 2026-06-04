import type { HabitRepository } from '../../infrastructure/supabase/repositories/habit.repository.js'
import type { TodayHabitItem } from '../../domain/habit.js'
import { habitsForDay } from '../../shared/habits/schedule.js'
import { todayInZone } from '../../shared/time/dates.js'
import { DateTime } from 'luxon'

export class HabitService {
  constructor(private readonly habits: HabitRepository) {}

  async listToday(userId: string, timezone: string): Promise<{
    date: string
    items: TodayHabitItem[]
  }> {
    const date = todayInZone(timezone)
    const jsDow = DateTime.fromISO(date, { zone: timezone }).weekday % 7

    const [allHabits, logs] = await Promise.all([
      this.habits.listByUserId(userId),
      this.habits.listLogsByUserId(userId),
    ])

    const todayHabits = habitsForDay(allHabits, jsDow)
    const items: TodayHabitItem[] = todayHabits.map((habit) => ({
      habit,
      completed: logs.some((l) => l.habitId === habit.id && l.date === date && l.completed),
    }))

    return { date, items }
  }

  async toggleToday(userId: string, habitId: string, timezone: string): Promise<boolean> {
    const date = todayInZone(timezone)
    return this.habits.toggleLog(userId, habitId, date)
  }
}
