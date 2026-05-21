/**
 * Серверная валидация для слоя данных.
 * В проекте нет app/api routes — мутации идут через Supabase client в store.
 * Эти функции — единая точка проверки перед записью в БД.
 * Ошибки валидации → JSON { status: 400, message, errors } (см. lib/errors/api-error.ts).
 */
export {
  applyValidationFailure,
  validateCategoryCreate,
  validateGoalCreate,
  validateGoalProgressInsert,
  validateGoalUpdate,
  validateHabitCreate,
  validateHabitLogInsert,
  validateHabitUpdate,
  validateMealEntryInsert,
  validateNutritionGoalsUpdate,
  validateProfilePatch,
} from './mutations'

export { parseInput } from './parse'
export type { ValidationFailure, ValidationResult, ValidationSuccess } from './errors'
export type { ApiErrorResponse } from '@/lib/errors/api-error'
export { toApiError, fromValidationFailure, HttpStatus } from '@/lib/errors/api-error'
