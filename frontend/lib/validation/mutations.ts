import { format } from 'date-fns'
import type { Category, Goal, GoalProgress, Habit, MealEntry, NutritionGoals, User } from '@/lib/types'
import { categoryCreateSchema } from './categories'
import type { ApiErrorResponse } from '@/lib/errors/api-error'
import { fromValidationFailure } from '@/lib/errors/api-error'
import { formatApiError, type ValidationFailure } from './errors'
import { goalCreateSchema, goalUpdateSchema, type GoalCreateInput } from './goals'
import { goalProgressInsertSchema } from './goal-progress'
import { habitCreateSchema, habitUpdateSchema } from './habits'
import { habitLogInsertSchema } from './habit-logs'
import { mealEntryInsertSchema } from './meal-entries'
import { nutritionGoalsPartialSchema } from './nutrition-goals'
import { parseInput } from './parse'
import { profileUpdateSchemaForClient } from './profiles'

export function applyValidationFailure(
  result: ValidationFailure,
  setError: (err: ApiErrorResponse) => void
): false {
  setError(fromValidationFailure(result))
  return false
}

/** @deprecated Используйте applyValidationFailure + ApiErrorResponse */
export function applyValidationFailureMessage(
  result: ValidationFailure,
  setError: (msg: string) => void
): false {
  setError(formatApiError(result))
  return false
}

export function validateHabitCreate(habit: Omit<Habit, 'id' | 'createdAt'>) {
  return parseInput(habitCreateSchema, habit)
}

export function validateHabitUpdate(updates: Partial<Habit>) {
  return parseInput(habitUpdateSchema, updates)
}

export function validateGoalCreate(goal: Omit<Goal, 'id' | 'createdAt'>) {
  const payload: GoalCreateInput = {
    name: goal.name,
    description: goal.description,
    type: goal.type,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    unit: goal.unit,
    deadline: format(goal.deadline, 'yyyy-MM-dd'),
    categoryId: goal.categoryId ?? '',
    category: goal.category,
    linkedHabitIds: goal.linkedHabitIds,
  }
  return parseInput(goalCreateSchema, payload)
}

export function validateGoalUpdate(updates: Partial<Goal>) {
  const payload = {
    ...updates,
    deadline: updates.deadline ? format(updates.deadline, 'yyyy-MM-dd') : undefined,
  }
  return parseInput(goalUpdateSchema, payload)
}

export function validateGoalProgressInsert(progress: Omit<GoalProgress, 'id'>) {
  return parseInput(goalProgressInsertSchema, progress)
}

export function validateHabitLogInsert(input: {
  habitId: string
  userId: string
  logDate: string
  completed?: boolean
}) {
  return parseInput(habitLogInsertSchema, input)
}

export function validateMealEntryInsert(entry: Omit<MealEntry, 'id'>) {
  return parseInput(mealEntryInsertSchema, entry)
}

export function validateProfilePatch(updates: Partial<User>) {
  return parseInput(profileUpdateSchemaForClient.partial(), updates)
}

export function validateNutritionGoalsUpdate(goals: Partial<NutritionGoals>) {
  return parseInput(nutritionGoalsPartialSchema, goals)
}

export function validateCategoryCreate(cat: Omit<Category, 'id'>) {
  return parseInput(categoryCreateSchema, cat)
}

export function toLogDate(date?: string | Date): string {
  if (typeof date === 'string') return date
  return format(date ?? new Date(), 'yyyy-MM-dd')
}
