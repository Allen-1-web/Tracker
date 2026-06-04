import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import {
  getNotificationPreferences,
  serializeNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/notifications/repository'
import { parseApiJsonBody } from '@/lib/validation/api-body'
import { notificationPreferencesPatchSchema } from '@/lib/validation/notifications'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications/preferences
 * PATCH /api/notifications/preferences
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

    const prefs = await getNotificationPreferences(supabase, auth.user.id)
    return jsonOk(serializeNotificationPreferences(prefs))
  } catch (err) {
    const api = toApiError(err, 'Не удалось загрузить настройки уведомлений')
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
    const parsed = parseApiJsonBody(notificationPreferencesPatchSchema, body)
    if (!parsed.success) return parsed.response

    const prefs = await updateNotificationPreferences(supabase, auth.user.id, parsed.data)
    return jsonOk(serializeNotificationPreferences(prefs))
  } catch (err) {
    const api = toApiError(err, 'Не удалось сохранить настройки уведомлений')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
