import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { TelegramStatus } from '@/lib/validation/telegram'
import { generateLinkToken, linkTokenExpiresAt } from './link-token'

export type AuthedClient = SupabaseClient<Database>

/**
 * Создать одноразовый токен deep-link для текущего пользователя.
 * Кладёт строку в telegram_link_tokens; чтение/чистка происходит на стороне бота.
 */
export async function createLinkToken(
  supabase: AuthedClient,
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateLinkToken()
  const expiresAt = linkTokenExpiresAt()

  const { error } = await supabase.from('telegram_link_tokens').insert({
    token,
    user_id: userId,
    expires_at: expiresAt.toISOString(),
  })
  if (error) throw error

  return { token, expiresAt }
}

/** Получить актуальный статус связки. */
export async function getTelegramStatus(
  supabase: AuthedClient,
  userId: string,
): Promise<TelegramStatus> {
  const { data, error } = await supabase
    .from('telegram_users')
    .select(
      'username, first_name, last_name, timezone, linked_at, last_seen_at',
    )
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error

  if (!data) {
    return {
      connected: false,
      username: null,
      firstName: null,
      lastName: null,
      timezone: null,
      linkedAt: null,
      lastSeenAt: null,
    }
  }

  return {
    connected: true,
    username: data.username,
    firstName: data.first_name,
    lastName: data.last_name,
    timezone: data.timezone,
    linkedAt: data.linked_at,
    lastSeenAt: data.last_seen_at,
  }
}

/** Отвязка: удаление строки telegram_users (триггер обновит profiles). */
export async function unlinkTelegram(
  supabase: AuthedClient,
  userId: string,
): Promise<{ removed: boolean }> {
  const { error, count } = await supabase
    .from('telegram_users')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
  if (error) throw error
  return { removed: (count ?? 0) > 0 }
}
