import { HttpStatus, toApiError, type ApiErrorResponse } from '@/lib/errors/api-error'
import { FORBIDDEN_MESSAGE, LOGIN_PATH } from './constants'

export function finalizeClientApiError(error: unknown, fallbackMessage?: string): ApiErrorResponse {
  const err = toApiError(error, fallbackMessage)
  if (err.status === HttpStatus.FORBIDDEN) {
    return { ...err, message: FORBIDDEN_MESSAGE }
  }
  return err
}

export function redirectToLogin(nextPath?: string): void {
  if (typeof window === 'undefined') return
  const next =
    nextPath && nextPath !== LOGIN_PATH && !nextPath.startsWith('/register')
      ? nextPath
      : undefined
  const url = new URL(LOGIN_PATH, window.location.origin)
  if (next) url.searchParams.set('next', next)
  window.location.assign(url.toString())
}

type ApplyOptions = {
  /** При 401 перенаправить на /login (по умолчанию true, если уже была сессия) */
  redirectOnUnauthorized?: boolean
}

/**
 * Обработка ответа Supabase/валидации в store:
 * 403 → dataError «Нет прав»; 401 при активной сессии → signOut + /login.
 */
export function applyClientApiError(
  error: unknown,
  ctx: {
    hasSession: boolean
    onShowError: (err: ApiErrorResponse) => void
    onUnauthorized: () => void
  },
  fallbackMessage?: string,
  options?: ApplyOptions
): ApiErrorResponse {
  const err = finalizeClientApiError(error, fallbackMessage)
  const redirectOnUnauthorized = options?.redirectOnUnauthorized ?? true

  if (err.status === HttpStatus.UNAUTHORIZED && redirectOnUnauthorized && ctx.hasSession) {
    ctx.onUnauthorized()
    return err
  }

  ctx.onShowError(err)
  return err
}
