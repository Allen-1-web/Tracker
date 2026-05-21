import type { ZodError } from 'zod'

export type ValidationErrors = Record<string, string[]>

export type ValidationSuccess<T> = {
  success: true
  data: T
}

export type ValidationFailure = {
  success: false
  message: string
  errors: ValidationErrors
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

export function zodErrorsToFieldMap(error: ZodError): ValidationErrors {
  const out: ValidationErrors = {}
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_form'
    if (!out[key]) out[key] = []
    out[key].push(issue.message)
  }
  return out
}

export function validationFailure(error: ZodError, fallbackMessage = 'Ошибка валидации'): ValidationFailure {
  const errors = zodErrorsToFieldMap(error)
  const first = error.issues[0]?.message ?? fallbackMessage
  return { success: false, message: first, errors }
}

export function validationSuccess<T>(data: T): ValidationSuccess<T> {
  return { success: true, data }
}

export function formatApiError(result: ValidationFailure): string {
  return result.message
}
