import type { NutritionRepository } from '../../infrastructure/supabase/repositories/nutrition.repository.js'
import type { NutritionDaySummary } from '../../domain/nutrition.js'
import { todayInZone } from '../../shared/time/dates.js'

function pct(value: number, goal: number): number {
  return goal <= 0 ? 0 : Math.min(Math.round((value / goal) * 100), 999)
}

export class NutritionService {
  constructor(private readonly nutrition: NutritionRepository) {}

  async todaySummary(userId: string, timezone: string): Promise<NutritionDaySummary> {
    const date = todayInZone(timezone)
    const [meals, goals] = await Promise.all([
      this.nutrition.listMealsByUserId(userId),
      this.nutrition.getGoals(userId),
    ])

    const dayMeals = meals.filter((m) => m.date === date)
    const totals = dayMeals.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        fat: acc.fat + e.fat,
        carbs: acc.carbs + e.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 },
    )

    return {
      date,
      totals,
      goals,
      percents: {
        calories: pct(totals.calories, goals.calories),
        protein: pct(totals.protein, goals.protein),
        fat: pct(totals.fat, goals.fat),
        carbs: pct(totals.carbs, goals.carbs),
      },
      entryCount: dayMeals.length,
    }
  }
}
