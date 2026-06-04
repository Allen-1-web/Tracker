import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import { unlinkTelegram } from '@/lib/telegram/repository'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/telegram/unlink
 * Отвязывает Telegram-аккаунт текущего пользователя.
 * Триггер sync_profile_telegram сбросит profiles.telegram_connected.
 */
export async function DELETE(): Promise<Response> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const result = await unlinkTelegram(supabase, auth.user.id)
    return jsonOk(result)
  } catch (err) {
    const api = toApiError(err, 'Не удалось отвязать Telegram')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
