import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import {
  getTelegramPreferences,
  serializeTelegramPreferences,
  updateTelegramPreferences,
} from '@/lib/notifications/repository'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { telegramPreferencesPatchSchema } from '@/lib/validation/notifications'

export const dynamic = 'force-dynamic'

/**
 * GET /api/telegram/preferences
 * PATCH /api/telegram/preferences
 */
export async function GET(): Promise<Response> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const prefs = await getTelegramPreferences(supabase, auth.user.id)
    if (!prefs) {
      return jsonOk(null)
    }
    return jsonOk(serializeTelegramPreferences(prefs))
  } catch (err) {
    const api = toApiError(err, 'Не удалось загрузить настройки Telegram')
    return jsonError(api.status, api.message, { code: api.code })
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const body: unknown = await request.json().catch(() => null)
    const parsed = parseApiJsonBody(telegramPreferencesPatchSchema, body)
    if (!parsed.success) return parsed.response

    const prefs = await updateTelegramPreferences(supabase, auth.user.id, parsed.data)
    return jsonOk(serializeTelegramPreferences(prefs))
  } catch (err) {
    const api = toApiError(err, 'Не удалось сохранить настройки Telegram')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
