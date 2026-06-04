import type { HabitService } from './habit.service.js'
import type { GoalService } from './goal.service.js'
import type { NutritionService } from './nutrition.service.js'

export interface DailyReport {
  date: string
  habits: { completed: number; total: number; percent: number }
  goals: { count: number; averageProgress: number }
  nutrition: {
    calories: number
    calorieGoal: number
    caloriePercent: number
  }
}

export class ReportService {
  constructor(
    private readonly habits: HabitService,
    private readonly goals: GoalService,
    private readonly nutrition: NutritionService,
  ) {}

  async buildDaily(userId: string, timezone: string): Promise<DailyReport> {
    const [habitDay, goalList, nutritionDay] = await Promise.all([
      this.habits.listToday(userId, timezone),
      this.goals.listActive(userId),
      this.nutrition.todaySummary(userId, timezone),
    ])

    const completed = habitDay.items.filter((i) => i.completed).length
    const total = habitDay.items.length
    const habitPercent = total === 0 ? 0 : Math.round((completed / total) * 100)

    const averageProgress =
      goalList.length === 0
        ? 0
        : Math.round(goalList.reduce((s, g) => s + g.progressPercent, 0) / goalList.length)

    return {
      date: habitDay.date,
      habits: { completed, total, percent: habitPercent },
      goals: { count: goalList.length, averageProgress },
      nutrition: {
        calories: Math.round(nutritionDay.totals.calories),
        calorieGoal: nutritionDay.goals.calories,
        caloriePercent: nutritionDay.percents.calories,
      },
    }
  }
}
