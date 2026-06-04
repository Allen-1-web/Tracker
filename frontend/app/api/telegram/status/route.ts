import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import { getTelegramStatus } from '@/lib/telegram/repository'

export const dynamic = 'force-dynamic'

/**
 * GET /api/telegram/status
 * Возвращает текущий статус привязки Telegram для авторизованного пользователя.
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

    const status = await getTelegramStatus(supabase, auth.user.id)
    return jsonOk(status)
  } catch (err) {
    const api = toApiError(err, 'Не удалось получить статус Telegram')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
