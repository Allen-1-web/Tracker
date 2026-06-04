import type { ZodType } from 'zod'
import { jsonFromApiError } from '@/lib/api/json-response'
import { fromValidationFailure } from '@/lib/errors/api-error'
import { validationFailure } from './errors'

export type ApiBodyParseResult<T> =
  | { success: true; data: T }
  | { success: false; response: Response }

/** Парсинг JSON-тела API с полевыми ошибками валидации. */
export function parseApiJsonBody<T>(schema: ZodType<T>, body: unknown): ApiBodyParseResult<T> {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return {
      success: false,
      response: jsonFromApiError(fromValidationFailure(validationFailure(parsed.error))),
    }
  }
  return { success: true, data: parsed.data }
}
