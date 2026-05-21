import { format } from 'date-fns'
import type { Goal, Habit, HabitLog, MealEntry, NutritionGoals } from './types'
import { computeAllHabitStats } from './habit-analytics'

export type DailyDashboardSnapshot = {
  date: string
  habits: {
    completed: number
    total: number
    percent: number
    bestStreak: number
  }
  goals: {
    count: number
    averageProgress: number
    items: { id: string; name: string; percent: number; current: number; target: number; unit?: string }[]
  }
  nutrition: {
    calories: number
    protein: number
    fat: number
    carbs: number
    caloriePercent: number
    proteinPercent: number
    fatPercent: number
    carbsPercent: number
    goals: NutritionGoals
  }
}

function habitsForDay(habits: Habit[], dayOfWeek: number): Habit[] {
  return habits.filter((h) => {
    if (h.isArchived) return false
    if (h.frequency === 'daily') return true
    if (Array.isArray(h.frequency)) return h.frequency.includes(dayOfWeek)
    return false
  })
}

function activeGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.currentValue < g.targetValue)
}

export function buildDailyDashboard(
  habits: Habit[],
  habitLogs: HabitLog[],
  goals: Goal[],
  mealEntries: MealEntry[],
  nutritionGoals: NutritionGoals,
  date: Date = new Date()
): DailyDashboardSnapshot {
  const dateStr = format(date, 'yyyy-MM-dd')
  const dow = date.getDay()
  const todayHabits = habitsForDay(habits, dow)
  const completed = todayHabits.filter((h) =>
    habitLogs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed)
  ).length
  const habitPercent =
    todayHabits.length === 0 ? 0 : Math.round((completed / todayHabits.length) * 100)

  const active = habits.filter((h) => !h.isArchived)
  const stats = computeAllHabitStats(active, habitLogs)
  const bestStreak = stats.length > 0 ? Math.max(...stats.map((s) => s.currentStreak), 0) : 0

  const activeGoalList = activeGoals(goals)
  const goalItems = activeGoalList.slice(0, 4).map((g) => {
    const percent = Math.min(Math.round((g.currentValue / g.targetValue) * 100), 100)
    return {
      id: g.id,
      name: g.name,
      percent,
      current: g.currentValue,
      target: g.targetValue,
      unit: g.unit,
    }
  })
  const averageProgress =
    activeGoalList.length === 0
      ? 0
      : Math.round(
          activeGoalList.reduce(
            (sum, g) => sum + Math.min((g.currentValue / g.targetValue) * 100, 100),
            0
          ) / activeGoalList.length
        )

  const dayMeals = mealEntries.filter((e) => e.date === dateStr)
  const totals = dayMeals.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      fat: acc.fat + e.fat,
      carbs: acc.carbs + e.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  const pct = (value: number, goal: number) =>
    goal <= 0 ? 0 : Math.min(Math.round((value / goal) * 100), 999)

  return {
    date: dateStr,
    habits: {
      completed,
      total: todayHabits.length,
      percent: habitPercent,
      bestStreak,
    },
    goals: {
      count: activeGoalList.length,
      averageProgress,
      items: goalItems,
    },
    nutrition: {
      ...totals,
      caloriePercent: pct(totals.calories, nutritionGoals.calories),
      proteinPercent: pct(totals.protein, nutritionGoals.protein),
      fatPercent: pct(totals.fat, nutritionGoals.fat),
      carbsPercent: pct(totals.carbs, nutritionGoals.carbs),
      goals: nutritionGoals,
    },
  }
}
