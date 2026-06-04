import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import { checkAuthRateLimit } from '@/lib/rate-limit/auth'
import { registerFormSchema } from '@/lib/validation/auth-forms'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { syncSessionAfterSignIn } from '@/lib/supabase/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request): Promise<Response> {
  const limited = await checkAuthRateLimit(request, 'sign-up')
  if (!limited.allowed) {
    return jsonError(
      HttpStatus.TOO_MANY_REQUESTS,
      'Слишком много попыток регистрации. Попробуйте через несколько минут.',
      { code: 'rate_limited' },
    )
  }

  const body: unknown = await request.json().catch(() => null)
  const parsed = parseApiJsonBody(registerFormSchema, body)
  if (!parsed.success) return parsed.response

  const email = parsed.data.email.trim().toLowerCase()
  const name = parsed.data.name.trim()

  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password: parsed.data.password,
      options: { data: { full_name: name } },
    })

    if (error) {
      const api = toApiError(error, 'Ошибка регистрации')
      if (process.env.NODE_ENV === 'production') {
        console.error('[auth/sign-up]', { code: api.code, status: api.status })
      }
      return jsonError(api.status, api.message, { code: api.code })
    }

    const needsEmailConfirmation = Boolean(data.user && !data.session)

    if (data.session) {
      await syncSessionAfterSignIn(supabase, data.session)
    }

    return jsonOk({
      ok: true,
      needsEmailConfirmation,
    })
  } catch (err) {
    const api = toApiError(err, 'Ошибка регистрации')
    if (process.env.NODE_ENV === 'production') {
      console.error('[auth/sign-up]', err)
    }
    return jsonError(api.status, api.message, { code: api.code })
  }
}
