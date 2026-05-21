import { apiErrorMessage, toApiError } from '@/lib/errors/api-error'
import type { ApiErrorResponse } from '@/lib/errors/api-error'

/** @deprecated Используйте toApiError() и .message */
export function userFacingSupabaseMessage(message: string): string {
  return apiErrorMessage(toApiError({ message })) ?? message
}

export type { ApiErrorResponse }
export { toApiError, apiErrorMessage }
