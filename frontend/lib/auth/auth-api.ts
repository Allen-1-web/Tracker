import { isApiErrorResponse, toApiError, type ApiErrorResponse } from '@/lib/errors/api-error'

type AuthApiSuccess = {
  ok: true
  needsEmailConfirmation: boolean
}

export async function postAuthAction(
  path: '/api/auth/sign-in' | '/api/auth/sign-up',
  body: Record<string, string>,
): Promise<{ data?: AuthApiSuccess; error?: ApiErrorResponse }> {
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  const raw: unknown = await res.json().catch(() => ({}))

  if (!res.ok) {
    if (isApiErrorResponse(raw)) {
      return { error: raw }
    }
    const message =
      typeof raw === 'object' && raw && 'message' in raw && typeof raw.message === 'string'
        ? raw.message
        : `HTTP ${res.status}`
    return { error: toApiError(message) }
  }

  const needsEmailConfirmation =
    typeof raw === 'object' &&
    raw !== null &&
    'needsEmailConfirmation' in raw &&
    Boolean((raw as AuthApiSuccess).needsEmailConfirmation)

  return { data: { ok: true, needsEmailConfirmation } }
}
