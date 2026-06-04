export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealEntry {
  id: string
  foodId: string
  date: string
  mealType: MealType
  amount: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface NutritionGoals {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface NutritionDaySummary {
  date: string
  totals: { calories: number; protein: number; fat: number; carbs: number }
  goals: NutritionGoals
  percents: { calories: number; protein: number; fat: number; carbs: number }
  entryCount: number
}
