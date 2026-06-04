import type { AdminClient } from '../client.js'
import { BotError } from '../../../domain/errors.js'

export interface LinkTokenRecord {
  token: string
  userId: string
  expiresAt: Date
  usedAt: Date | null
  createdAt: Date
}

export class LinkTokenRepository {
  constructor(private readonly db: AdminClient) {}

  async find(token: string): Promise<LinkTokenRecord | null> {
    const { data, error } = await this.db
      .from('telegram_link_tokens')
      .select('*')
      .eq('token', token)
      .maybeSingle()
    if (error) throw new BotError('internal', error.message, { cause: error })
    if (!data) return null
    return {
      token: data.token,
      userId: data.user_id,
      expiresAt: new Date(data.expires_at),
      usedAt: data.used_at ? new Date(data.used_at) : null,
      createdAt: new Date(data.created_at),
    }
  }

  /**
   * Atomic consume: помечает токен как использованный, если он ещё не использован
   * и не просрочен. Возвращает запись токена или бросает соответствующую BotError.
   */
  async consume(token: string): Promise<LinkTokenRecord> {
    const record = await this.find(token)
    if (!record) {
      throw new BotError('invalid_link_token', 'Ссылка недействительна')
    }
    if (record.usedAt) {
      throw new BotError('link_token_used', 'Эта ссылка уже использована')
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new BotError('link_token_expired', 'Ссылка истекла. Сгенерируйте новую в «Настройках».')
    }

    const usedAt = new Date().toISOString()
    const { data, error } = await this.db
      .from('telegram_link_tokens')
      .update({ used_at: usedAt })
      .eq('token', token)
      .is('used_at', null)
      .select('user_id')
      .single()

    if (error || !data) {
      // race: кто-то успел использовать первым
      throw new BotError('link_token_used', 'Эта ссылка уже использована')
    }

    return { ...record, usedAt: new Date(usedAt) }
  }

  /** Best-effort очистка просроченных. Вызывается лениво из bootstrap. */
  async cleanupExpired(): Promise<number> {
    const { error, count } = await this.db
      .from('telegram_link_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', new Date().toISOString())
      .is('used_at', null)
    if (error) return 0
    return count ?? 0
  }
}
