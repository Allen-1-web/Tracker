import type { PostgrestError } from '@supabase/supabase-js'
import type { ValidationFailure } from '@/lib/validation/errors'
import { AuthGuardError } from '@/lib/auth/guards'
import { FORBIDDEN_MESSAGE } from '@/lib/auth/constants'

/** JSON-тело ошибки (как у HTTP API: status + message). */
export type ApiErrorResponse = {
  status: number
  message: string
  code?: string
  errors?: Record<string, string[]>
}

export const HttpStatus = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
} as const

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function genericMessageForStatus(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return 'Войдите в аккаунт, чтобы продолжить.'
    case HttpStatus.FORBIDDEN:
      return FORBIDDEN_MESSAGE
    case HttpStatus.NOT_FOUND:
      return 'Запись не найдена.'
    case HttpStatus.CONFLICT:
      return 'Такая запись уже существует.'
    case HttpStatus.TOO_MANY_REQUESTS:
      return 'Слишком много запросов. Попробуйте позже.'
    case HttpStatus.INTERNAL:
      return 'Произошла ошибка. Попробуйте позже.'
    default:
      return 'Некорректные данные. Проверьте поля и попробуйте снова.'
  }
}

export function apiError(
  status: number,
  message: string,
  extra?: Pick<ApiErrorResponse, 'code' | 'errors'>
): ApiErrorResponse {
  return { status, message, ...extra }
}

export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ApiErrorResponse).status === 'number' &&
    typeof (value as ApiErrorResponse).message === 'string'
  )
}

export function fromValidationFailure(failure: ValidationFailure): ApiErrorResponse {
  return apiError(HttpStatus.BAD_REQUEST, failure.message, {
    code: 'validation_error',
    errors: failure.errors,
  })
}

export function fromAuthGuardError(error: AuthGuardError): ApiErrorResponse {
  const status = error.code === 'forbidden' ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED
  const message = status === HttpStatus.FORBIDDEN ? FORBIDDEN_MESSAGE : error.message
  return apiError(status, message, { code: error.code })
}

const FRIENDLY: Record<string, string> = {
  'permission_denied: cannot change role': 'Нельзя изменить свою роль.',
  'permission_denied: admin only': 'Доступ только для администратора.',
  'permission_denied: cannot demote yourself': 'Администратор не может понизить свою роль.',
  'Invalid login credentials': 'Неверный email или пароль.',
  'Email not confirmed': 'Подтвердите email перед входом.',
  'rate limit': 'Слишком много попыток. Попробуйте позже.',
  'over_email_send_rate_limit': 'Слишком много писем. Подождите и попробуйте снова.',
}

function friendlyMessage(raw: string, status: number = HttpStatus.BAD_REQUEST): string {
  const trimmed = raw.trim()
  for (const [key, value] of Object.entries(FRIENDLY)) {
    if (trimmed.includes(key)) return value
  }
  if (
    trimmed.toLowerCase().includes('row-level security') ||
    trimmed.toLowerCase().includes('permission_denied') ||
    trimmed.includes('42501')
  ) {
    return FORBIDDEN_MESSAGE
  }
  if (trimmed.toLowerCase().includes('jwt') || trimmed.toLowerCase().includes('not authenticated')) {
    return 'Войдите в аккаунт, чтобы продолжить.'
  }
  if (trimmed.includes('violates') || trimmed.includes('23514') || trimmed.includes('23505')) {
    return 'Некорректные данные. Проверьте поля и попробуйте снова.'
  }
  if (isProduction()) {
    return genericMessageForStatus(status)
  }
  return trimmed || 'Произошла ошибка. Попробуйте ещё раз.'
}

function statusFromSupabase(message: string, code?: string | null): number {
  const m = message.toLowerCase()
  const c = code ?? ''

  if (
    c === '42501' ||
    m.includes('permission_denied') ||
    m.includes('row-level security') ||
    m.includes('admin only') ||
    m.includes('cannot change role')
  ) {
    return HttpStatus.FORBIDDEN
  }

  if (m.includes('jwt') || m.includes('not authenticated') || c === 'PGRST301') {
    return HttpStatus.UNAUTHORIZED
  }

  if (
    c.startsWith('23') ||
    c === '22P02' ||
    m.includes('violates') ||
    m.includes('invalid input') ||
    m.includes('check constraint')
  ) {
    return HttpStatus.BAD_REQUEST
  }

  if (c === 'PGRST116') {
    return HttpStatus.NOT_FOUND
  }

  return HttpStatus.BAD_REQUEST
}

export function fromSupabaseError(error: PostgrestError | { message: string; code?: string }): ApiErrorResponse {
  const status = statusFromSupabase(error.message, 'code' in error ? error.code : undefined)
  const message =
    status === HttpStatus.FORBIDDEN
      ? FORBIDDEN_MESSAGE
      : friendlyMessage(error.message, status)
  return apiError(status, message, {
    code: 'code' in error && error.code ? error.code : 'supabase_error',
  })
}

export function fromUnknown(error: unknown, fallbackMessage = 'Произошла ошибка'): ApiErrorResponse {
  if (isApiErrorResponse(error)) return error
  if (error instanceof AuthGuardError) return fromAuthGuardError(error)
  if (error instanceof Error) {
    const status = statusFromSupabase(error.message)
    return apiError(status, friendlyMessage(error.message, status), { code: 'client_error' })
  }
  if (typeof error === 'string') {
    const status = statusFromSupabase(error)
    return apiError(status, friendlyMessage(error, status), { code: 'client_error' })
  }
  return apiError(HttpStatus.INTERNAL, fallbackMessage, { code: 'internal_error' })
}

/** Единая точка: ValidationFailure | Supabase | AuthGuard | Error → JSON-ошибка */
export function toApiError(error: unknown, fallbackMessage?: string): ApiErrorResponse {
  if (isApiErrorResponse(error)) return error
  if (error && typeof error === 'object' && 'success' in error && (error as ValidationFailure).success === false) {
    return fromValidationFailure(error as ValidationFailure)
  }
  if (error instanceof AuthGuardError) return fromAuthGuardError(error)
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as { message: string; code?: string }
    if (e.code?.startsWith('PGRST') || e.code?.startsWith('23') || e.code === '42501') {
      return fromSupabaseError(e as PostgrestError)
    }
    return fromUnknown(e.message)
  }
  return fromUnknown(error, fallbackMessage)
}

/** Текст для баннеров (без изменения вёрстки) */
export function apiErrorMessage(error: ApiErrorResponse | null | undefined): string | null {
  return error?.message ?? null
}
