import type { ZodType } from 'zod'
import { validationFailure, validationSuccess, type ValidationResult } from './errors'

export function parseInput<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }
  return validationSuccess(parsed.data)
}
