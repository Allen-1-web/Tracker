import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import { checkAuthRateLimit } from '@/lib/rate-limit/auth'
import { loginFormSchema } from '@/lib/validation/auth-forms'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { syncSessionAfterSignIn } from '@/lib/supabase/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const body: unknown = await request.json().catch(() => null)
  const parsed = parseApiJsonBody(loginFormSchema, body)
  if (!parsed.success) return parsed.response

  const email = parsed.data.email.trim().toLowerCase()
  const limited = await checkAuthRateLimit(request, 'sign-in', email)
  if (!limited.allowed) {
    return jsonError(
      HttpStatus.TOO_MANY_REQUESTS,
      'Слишком много попыток входа. Попробуйте через несколько минут.',
      { code: 'rate_limited' },
    )
  }

  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    })

    if (error) {
      const api = toApiError(error, 'Ошибка входа')
      if (process.env.NODE_ENV === 'production') {
        console.error('[auth/sign-in]', { code: api.code, status: api.status })
      }
      return jsonError(api.status, api.message, { code: api.code })
    }

    if (data.session) {
      await syncSessionAfterSignIn(supabase, data.session)
    }

    return jsonOk({
      ok: true,
      needsEmailConfirmation: false,
    })
  } catch (err) {
    const api = toApiError(err, 'Ошибка входа')
    if (process.env.NODE_ENV === 'production') {
      console.error('[auth/sign-in]', err)
    }
    return jsonError(api.status, api.message, { code: api.code })
  }
}
