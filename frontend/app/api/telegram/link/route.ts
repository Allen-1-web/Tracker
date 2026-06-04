import { getSupabaseServerClient } from '@/lib/supabase/server'
import { jsonError, jsonOk } from '@/lib/api/json-response'
import { HttpStatus, toApiError } from '@/lib/errors/api-error'
import { createLinkToken } from '@/lib/telegram/repository'
import { buildDeepLink } from '@/lib/telegram/link-token'
import { getTelegramBotUsername } from '@/lib/telegram/env'
import type { LinkResponse } from '@/lib/validation/telegram'

export const dynamic = 'force-dynamic'

/**
 * POST /api/telegram/link
 * Создаёт одноразовый deep-link для связки Telegram-аккаунта с текущим user_id.
 * Требует аутентифицированной сессии (cookie-based @supabase/ssr).
 */
export async function POST(): Promise<Response> {
  try {
    const botUsername = getTelegramBotUsername()
    if (!botUsername) {
      return jsonError(
        HttpStatus.INTERNAL,
        'Telegram-бот не сконфигурирован на сервере (TELEGRAM_BOT_USERNAME пуст).',
        { code: 'telegram_not_configured' },
      )
    }

    const supabase = await getSupabaseServerClient()
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth?.user) {
      return jsonError(HttpStatus.UNAUTHORIZED, 'Требуется вход в аккаунт', {
        code: 'unauthenticated',
      })
    }

    const { token, expiresAt } = await createLinkToken(supabase, auth.user.id)
    const body: LinkResponse = {
      token,
      deepLink: buildDeepLink(token, botUsername),
      expiresAt: expiresAt.toISOString(),
      botUsername,
    }
    return jsonOk(body, 201)
  } catch (err) {
    const api = toApiError(err, 'Не удалось создать ссылку для подключения Telegram')
    return jsonError(api.status, api.message, { code: api.code })
  }
}
