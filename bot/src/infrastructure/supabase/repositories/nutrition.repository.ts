import type { AdminClient } from '../client.js'
import type { MealEntry, MealType, NutritionGoals } from '../../../domain/nutrition.js'
import { BotError } from '../../../domain/errors.js'

const DEFAULT_GOALS: NutritionGoals = {
  calories: 2200,
  protein: 150,
  fat: 70,
  carbs: 250,
}

export class NutritionRepository {
  constructor(private readonly db: AdminClient) {}

  async getGoals(userId: string): Promise<NutritionGoals> {
    const { data, error } = await this.db
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    if (!data) return DEFAULT_GOALS
    return {
      calories: Number(data.calories),
      protein: Number(data.protein),
      fat: Number(data.fat),
      carbs: Number(data.carbs),
    }
  }

  async listMealsByUserId(userId: string): Promise<MealEntry[]> {
    const { data, error } = await this.db
      .from('meal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (data ?? []).map((m) => ({
      id: m.id,
      foodId: m.food_id,
      date: m.entry_date,
      mealType: m.meal_type as MealType,
      amount: Number(m.amount),
      calories: Number(m.calories),
      protein: Number(m.protein),
      fat: Number(m.fat),
      carbs: Number(m.carbs),
    }))
  }
}
