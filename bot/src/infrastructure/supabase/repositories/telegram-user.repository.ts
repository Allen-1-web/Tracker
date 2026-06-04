import type { AdminClient } from '../client.js'
import type { Database } from '../../../domain/database.types.js'
import type { ContactInfo, LinkedUser } from '../../../domain/user.js'
import { BotError } from '../../../domain/errors.js'

type Row = Database['public']['Tables']['telegram_users']['Row']

function toDomain(row: Row): LinkedUser {
  return {
    userId: row.user_id,
    telegramChatId: row.telegram_chat_id,
    telegramUserId: row.telegram_user_id,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    languageCode: row.language_code,
    timezone: row.timezone,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    isBlocked: row.is_blocked,
    linkedAt: new Date(row.linked_at),
    lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at) : null,
  }
}

/**
 * Repository для telegram_users (service_role).
 * ⚠️ Каждый запрос явно фильтрует по user_id или chat_id —
 * RLS обходится сервисной ролью, защита целиком на уровне кода.
 */
export class TelegramUserRepository {
  constructor(private readonly db: AdminClient) {}

  async findByChatId(chatId: number): Promise<LinkedUser | null> {
    const { data, error } = await this.db
      .from('telegram_users')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    return data ? toDomain(data) : null
  }

  async findByUserId(userId: string): Promise<LinkedUser | null> {
    const { data, error } = await this.db
      .from('telegram_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    return data ? toDomain(data) : null
  }

  /**
   * Upsert связки. Если у user_id уже есть связка — обновляет chat_id и контактные данные
   * (поведение «переподключить на новое устройство»).
   */
  async upsertLink(args: {
    userId: string
    contact: ContactInfo
    defaultTimezone: string
  }): Promise<LinkedUser> {
    const { userId, contact, defaultTimezone } = args

    // Если этот chat уже занят другим user_id — запрещаем (двойная связка).
    const conflict = await this.findByChatId(contact.telegramChatId)
    if (conflict && conflict.userId !== userId) {
      throw new BotError(
        'chat_already_linked',
        'Этот Telegram-аккаунт уже привязан к другому пользователю. ' +
          'Откройте «Настройки» в том аккаунте и отвяжите Telegram, либо войдите в правильный аккаунт.',
      )
    }

    const payload: Database['public']['Tables']['telegram_users']['Insert'] = {
      user_id: userId,
      telegram_chat_id: contact.telegramChatId,
      telegram_user_id: contact.telegramUserId,
      username: contact.username ?? null,
      first_name: contact.firstName ?? null,
      last_name: contact.lastName ?? null,
      language_code: contact.languageCode ?? null,
      timezone: defaultTimezone,
      is_blocked: false,
      last_seen_at: new Date().toISOString(),
    }

    const { data, error } = await this.db
      .from('telegram_users')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single()
    if (error || !data) {
      throw new BotError('internal', error?.message ?? 'upsert failed', { cause: error })
    }
    return toDomain(data)
  }

  async touchLastSeen(userId: string): Promise<void> {
    const { error } = await this.db
      .from('telegram_users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', userId)
    if (error) throw new BotError('internal', error.message, { cause: error })
  }

  async markBlocked(userId: string, blocked: boolean): Promise<void> {
    const { error } = await this.db
      .from('telegram_users')
      .update({ is_blocked: blocked })
      .eq('user_id', userId)
    if (error) throw new BotError('internal', error.message, { cause: error })
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const { error, count } = await this.db
      .from('telegram_users')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (count ?? 0) > 0
  }

  /** Все активные связки (не заблокировали бота). */
  async listActive(): Promise<LinkedUser[]> {
    const { data, error } = await this.db
      .from('telegram_users')
      .select('*')
      .eq('is_blocked', false)
    if (error) throw new BotError('internal', error.message, { cause: error })
    return (data ?? []).map(toDomain)
  }
}
