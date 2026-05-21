export type HabitFrequency = 'daily' | number[] // number[] = дни недели 0-6

export interface Habit {
  id: string
  name: string
  icon: string
  color: string
  /** FK → categories.id */
  categoryId: string | null
  /** Имя категории для UI (резолвится при загрузке из categories) */
  category: string
  frequency: HabitFrequency
  createdAt: Date
  isArchived: boolean
}

export interface HabitLog {
  habitId: string
  date: string // 'YYYY-MM-DD'
  completed: boolean
}

export type GoalType = 'numeric' | 'binary'
/** Только для отображения; в БД отдельного поля status нет */
export type GoalStatus = 'active' | 'completed'

export interface Goal {
  id: string
  name: string
  description?: string
  type: GoalType
  targetValue: number
  currentValue: number
  unit?: string
  deadline: Date
  /** FK → categories.id */
  categoryId: string | null
  /** Имя категории для UI (резолвится при загрузке из categories) */
  category: string
  linkedHabitIds: string[]
  createdAt: Date
}

export interface GoalProgress {
  id: string
  goalId: string
  date: Date
  value: number
  note?: string
}

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  role: UserRole
  name: string
  email: string
  avatarUrl?: string
  telegramConnected: boolean
  telegramUsername?: string
  theme: 'light' | 'dark' | 'system'
  reminderTime?: string // 'HH:mm'
  remindersEnabled: boolean
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface HabitStats {
  habitId: string
  currentStreak: number
  bestStreak: number
  completionRate30: number
  completionRate90: number
  totalCompleted: number
}

// ─── Nutrition / КБЖУ ────────────────────────────────────────────────────────

export type FoodCategory =
  | 'proteins'
  | 'grains'
  | 'dairy'
  | 'vegetables'
  | 'fruits'
  | 'fats'
  | 'drinks'
  | 'sweets'
  | 'other'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

/** Nutritional values are per 100 g / 100 ml */
export interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  category: FoodCategory
}

/** A single logged food entry */
export interface MealEntry {
  id: string
  foodId: string
  date: string      // 'YYYY-MM-DD'
  mealType: MealType
  amount: number    // grams / ml
  // denormalised totals (computed from amount)
  calories: number
  protein: number
  fat: number
  carbs: number
}

/** User's daily macro targets */
export interface NutritionGoals {
  calories: number
  protein: number
  fat: number
  carbs: number
}
